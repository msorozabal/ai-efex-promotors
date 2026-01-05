"""
EFEX Promotor Copilot - Main Application
Flask backend with JWT authentication and AWS Bedrock integration
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from datetime import datetime
import os

from config import config
from models import db, User, Client, Conversation, Message
from ai_service import copilot_service

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions - allowing all origins for development
    CORS(app, origins=['*'], supports_credentials=True)
    db.init_app(app)
    jwt = JWTManager(app)

    # Create tables
    with app.app_context():
        db.create_all()

    # ==================== Auth Routes ====================

    @app.route('/api/auth/register', methods=['POST'])
    def register():
        """Register a new promotor"""
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409

        user = User(
            email=data['email'],
            name=data['name'],
            zona=data.get('zona', ''),
            role='promotor'
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Login and get JWT token"""
        data = request.get_json()

        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    @app.route('/api/auth/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        """Get current user info"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200

    # ==================== Copilot Chat Routes ====================

    @app.route('/api/copilot/chat', methods=['POST'])
    @jwt_required()
    def chat():
        """Send a message to the copilot"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        message = data['message']
        conversation_id = data.get('conversation_id')

        # Get or create conversation
        if conversation_id:
            conversation = Conversation.query.filter_by(
                id=conversation_id,
                user_id=user_id
            ).first()
            if not conversation:
                return jsonify({'error': 'Conversation not found'}), 404
        else:
            # Create new conversation
            conversation = Conversation(
                user_id=user_id,
                title=message[:50] + '...' if len(message) > 50 else message
            )
            db.session.add(conversation)
            db.session.commit()

        # Get conversation history
        history = [
            {'role': msg.role, 'content': msg.content}
            for msg in conversation.messages
        ]

        # Build context
        context = {
            'promotor_name': user.name,
            'promotor_zona': user.zona,
            'clientes_activos': user.clientes_activos
        }

        # Get AI response
        result = copilot_service.chat(message, history, context)

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            role='user',
            content=message
        )
        db.session.add(user_msg)

        # Save assistant response
        assistant_msg = Message(
            conversation_id=conversation.id,
            role='assistant',
            content=result['response']
        )
        db.session.add(assistant_msg)
        db.session.commit()

        return jsonify({
            'response': result['response'],
            'conversation_id': conversation.id,
            'success': result.get('success', True)
        }), 200

    @app.route('/api/copilot/conversations', methods=['GET'])
    @jwt_required()
    def get_conversations():
        """Get all conversations for the current user"""
        user_id = int(get_jwt_identity())
        conversations = Conversation.query.filter_by(user_id=user_id)\
            .order_by(Conversation.updated_at.desc()).all()

        return jsonify({
            'conversations': [
                {
                    'id': c.id,
                    'title': c.title,
                    'updated_at': c.updated_at.isoformat(),
                    'message_count': len(c.messages)
                }
                for c in conversations
            ]
        }), 200

    @app.route('/api/copilot/conversations/<int:id>', methods=['GET'])
    @jwt_required()
    def get_conversation(id):
        """Get a specific conversation with messages"""
        user_id = int(get_jwt_identity())
        conversation = Conversation.query.filter_by(
            id=id,
            user_id=user_id
        ).first()

        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        return jsonify({'conversation': conversation.to_dict()}), 200

    @app.route('/api/copilot/conversations/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_conversation(id):
        """Delete a conversation"""
        user_id = int(get_jwt_identity())
        conversation = Conversation.query.filter_by(
            id=id,
            user_id=user_id
        ).first()

        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        # Delete all messages first
        Message.query.filter_by(conversation_id=id).delete()
        db.session.delete(conversation)
        db.session.commit()

        return jsonify({'message': 'Conversation deleted'}), 200

    # ==================== Client Management Routes ====================

    @app.route('/api/clients', methods=['GET'])
    @jwt_required()
    def get_clients():
        """Get all clients for the current promotor"""
        user_id = int(get_jwt_identity())
        status = request.args.get('status')

        query = Client.query.filter_by(promotor_id=user_id)
        if status:
            query = query.filter_by(status=status)

        clients = query.order_by(Client.created_at.desc()).all()

        return jsonify({
            'clients': [c.to_dict() for c in clients]
        }), 200

    @app.route('/api/clients', methods=['POST'])
    @jwt_required()
    def create_client():
        """Create a new client"""
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data or 'name' not in data:
            return jsonify({'error': 'Client name is required'}), 400

        client = Client(
            promotor_id=user_id,
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            business_name=data.get('business_name'),
            business_type=data.get('business_type'),
            status=data.get('status', 'prospecto'),
            notes=data.get('notes')
        )

        db.session.add(client)

        # Update promotor's active client count
        user = User.query.get(user_id)
        user.clientes_activos = Client.query.filter_by(
            promotor_id=user_id,
            status='activo'
        ).count() + (1 if data.get('status') == 'activo' else 0)

        db.session.commit()

        return jsonify({
            'message': 'Client created',
            'client': client.to_dict()
        }), 201

    @app.route('/api/clients/<int:id>', methods=['GET'])
    @jwt_required()
    def get_client(id):
        """Get a specific client"""
        user_id = int(get_jwt_identity())
        client = Client.query.filter_by(id=id, promotor_id=user_id).first()

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        return jsonify({'client': client.to_dict()}), 200

    @app.route('/api/clients/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_client(id):
        """Update a client"""
        user_id = int(get_jwt_identity())
        client = Client.query.filter_by(id=id, promotor_id=user_id).first()

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        data = request.get_json()

        if 'name' in data:
            client.name = data['name']
        if 'email' in data:
            client.email = data['email']
        if 'phone' in data:
            client.phone = data['phone']
        if 'business_name' in data:
            client.business_name = data['business_name']
        if 'business_type' in data:
            client.business_type = data['business_type']
        if 'status' in data:
            client.status = data['status']
        if 'notes' in data:
            client.notes = data['notes']

        client.last_contact = datetime.utcnow()

        # Update promotor's active client count
        user = User.query.get(user_id)
        user.clientes_activos = Client.query.filter_by(
            promotor_id=user_id,
            status='activo'
        ).count()

        db.session.commit()

        return jsonify({
            'message': 'Client updated',
            'client': client.to_dict()
        }), 200

    @app.route('/api/clients/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_client(id):
        """Delete a client"""
        user_id = int(get_jwt_identity())
        client = Client.query.filter_by(id=id, promotor_id=user_id).first()

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        db.session.delete(client)

        # Update promotor's active client count
        user = User.query.get(user_id)
        user.clientes_activos = Client.query.filter_by(
            promotor_id=user_id,
            status='activo'
        ).count()

        db.session.commit()

        return jsonify({'message': 'Client deleted'}), 200

    # ==================== AI Tools Routes ====================

    @app.route('/api/copilot/generate-message', methods=['POST'])
    @jwt_required()
    def generate_message():
        """Generate a message for a client"""
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data or 'client_id' not in data or 'message_type' not in data:
            return jsonify({'error': 'client_id and message_type are required'}), 400

        client = Client.query.filter_by(
            id=data['client_id'],
            promotor_id=user_id
        ).first()

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        result = copilot_service.generate_client_message(
            data['message_type'],
            client.to_dict()
        )

        return jsonify({
            'message': result['response'],
            'success': result.get('success', True)
        }), 200

    @app.route('/api/copilot/analyze-opportunity', methods=['POST'])
    @jwt_required()
    def analyze_opportunity():
        """Analyze a client opportunity"""
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data or 'client_id' not in data:
            return jsonify({'error': 'client_id is required'}), 400

        client = Client.query.filter_by(
            id=data['client_id'],
            promotor_id=user_id
        ).first()

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        result = copilot_service.analyze_opportunity(client.to_dict())

        return jsonify({
            'analysis': result['response'],
            'success': result.get('success', True)
        }), 200

    # ==================== Dashboard Stats ====================

    @app.route('/api/dashboard/stats', methods=['GET'])
    @jwt_required()
    def get_dashboard_stats():
        """Get dashboard statistics for the current promotor"""
        user_id = int(get_jwt_identity())

        total_clients = Client.query.filter_by(promotor_id=user_id).count()
        active_clients = Client.query.filter_by(
            promotor_id=user_id,
            status='activo'
        ).count()
        prospects = Client.query.filter_by(
            promotor_id=user_id,
            status='prospecto'
        ).count()
        conversations = Conversation.query.filter_by(user_id=user_id).count()

        return jsonify({
            'stats': {
                'total_clients': total_clients,
                'active_clients': active_clients,
                'prospects': prospects,
                'conversations': conversations
            }
        }), 200

    # ==================== Health Check ====================

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'service': 'EFEX Promotor Copilot API'
        }), 200

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
