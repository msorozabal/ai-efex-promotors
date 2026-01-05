"""
AI Service for EFEX Promotor Copilot
Integrates with AWS Bedrock and Claude Opus 4.5
"""
import boto3
import json
from config import Config

# System prompt for the EFEX Promotor Copilot
EFEX_COPILOT_SYSTEM_PROMPT = """Eres el Copiloto de EFEX, un asistente inteligente especializado en ayudar a promotores de EFEX (plataforma fintech de pagos en Mexico).

## Sobre EFEX
EFEX es una plataforma bancaria para empresas que realizan comercio transfronterizo con EE.UU., ofreciendo:
- Apertura de cuentas bancarias multi-pais
- Mantenimiento de fondos en USD
- Conversion a monedas locales (MXN, COP, etc.)
- Pagos instantaneos o programados
- Transferencias internacionales simplificadas
- Regulado por la CNBV (Comision Nacional Bancaria y de Valores) en Mexico

## Tu Rol como Copiloto
Eres el asistente personal de los promotores de EFEX. Tu objetivo es ayudarlos a:

1. **Atencion al Cliente**
   - Redactar respuestas profesionales para clientes
   - Explicar productos y servicios de EFEX
   - Resolver dudas sobre procesos y requisitos

2. **Gestion de Prospectos**
   - Identificar oportunidades de venta
   - Sugerir estrategias de seguimiento
   - Preparar presentaciones y propuestas

3. **Automatizacion de Tareas**
   - Generar mensajes de seguimiento
   - Crear plantillas de comunicacion
   - Resumir conversaciones con clientes

4. **Conocimiento del Producto**
   - Explicar comisiones y tarifas
   - Detallar requisitos de apertura de cuenta
   - Comparar con competencia cuando sea apropiado

5. **Compliance y Regulacion**
   - Recordar requisitos regulatorios
   - Guiar sobre KYC/AML
   - Informar sobre documentacion necesaria

## Estilo de Comunicacion
- Profesional pero accesible
- Orientado a resultados
- Proactivo en sugerencias
- Claro y conciso
- Siempre en espanol mexicano
- Usa terminologia financiera apropiada

## Limitaciones
- No puedes realizar transacciones reales
- No tienes acceso a datos bancarios sensibles
- Debes recomendar consultar con soporte para casos complejos
- Siempre prioriza la seguridad y compliance

Cuando el promotor te haga una pregunta, responde de manera util y practica, siempre enfocado en ayudarle a ser mas efectivo y atender mejor a sus clientes."""


class EFEXCopilotService:
    """Service for interacting with Claude via AWS Bedrock"""

    def __init__(self):
        self.client = None
        self.model_id = Config.CLAUDE_MODEL_ID
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Bedrock Runtime client"""
        try:
            if Config.AWS_ACCESS_KEY_ID and Config.AWS_SECRET_ACCESS_KEY:
                # Build credentials dict
                credentials = {
                    'aws_access_key_id': Config.AWS_ACCESS_KEY_ID,
                    'aws_secret_access_key': Config.AWS_SECRET_ACCESS_KEY
                }
                # Add session token if present (for temporary credentials)
                if Config.AWS_SESSION_TOKEN:
                    credentials['aws_session_token'] = Config.AWS_SESSION_TOKEN

                self.client = boto3.client(
                    'bedrock-runtime',
                    region_name=Config.AWS_REGION,
                    **credentials
                )
                print(f"Bedrock client initialized with explicit credentials for region: {Config.AWS_REGION}")
                print(f"Using model: {self.model_id}")
            else:
                # Use default credentials (IAM role, environment, etc.)
                self.client = boto3.client(
                    'bedrock-runtime',
                    region_name=Config.AWS_REGION
                )
                print(f"Bedrock client initialized with default credentials")
        except Exception as e:
            print(f"Warning: Could not initialize Bedrock client: {e}")
            self.client = None

    def _build_messages(self, conversation_history: list, user_message: str) -> list:
        """Build the messages array for the API call"""
        messages = []

        # Add conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add the new user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        return messages

    def chat(self, user_message: str, conversation_history: list = None,
             context: dict = None) -> dict:
        """
        Send a message to the copilot and get a response

        Args:
            user_message: The user's message
            conversation_history: List of previous messages [{role, content}]
            context: Additional context (client info, promotor info, etc.)

        Returns:
            dict with 'response' and 'success' keys
        """
        if conversation_history is None:
            conversation_history = []

        # Build enhanced system prompt with context
        system_prompt = EFEX_COPILOT_SYSTEM_PROMPT
        if context:
            context_info = "\n\n## Contexto Actual\n"
            if context.get('promotor_name'):
                context_info += f"- Promotor: {context['promotor_name']}\n"
            if context.get('promotor_zona'):
                context_info += f"- Zona: {context['promotor_zona']}\n"
            if context.get('clientes_activos'):
                context_info += f"- Clientes activos: {context['clientes_activos']}\n"
            if context.get('client_info'):
                context_info += f"- Cliente actual: {context['client_info']}\n"
            system_prompt += context_info

        messages = self._build_messages(conversation_history, user_message)

        # If Bedrock client is not available, use mock response for development
        if not self.client:
            return self._mock_response(user_message)

        try:
            # Prepare the request for Claude via Bedrock
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": messages
            }

            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )

            response_body = json.loads(response['body'].read())

            return {
                'success': True,
                'response': response_body['content'][0]['text'],
                'usage': {
                    'input_tokens': response_body.get('usage', {}).get('input_tokens', 0),
                    'output_tokens': response_body.get('usage', {}).get('output_tokens', 0)
                }
            }

        except Exception as e:
            print(f"Error calling Bedrock: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': f"Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo. Error: {str(e)}"
            }

    def _mock_response(self, user_message: str) -> dict:
        """Mock response for development without AWS credentials"""
        mock_responses = {
            'default': """Hola! Soy tu Copiloto EFEX. Estoy aqui para ayudarte a ser mas efectivo como promotor.

Puedo ayudarte con:
- Redactar mensajes para clientes
- Explicar productos y servicios de EFEX
- Preparar propuestas de venta
- Resolver dudas sobre procesos

**Nota:** Actualmente estoy en modo de desarrollo. Para funcionalidad completa, configura tus credenciales de AWS Bedrock.

Como puedo ayudarte hoy?"""
        }

        # Check for specific keywords
        message_lower = user_message.lower()

        if 'cliente' in message_lower or 'prospecto' in message_lower:
            response = """Entiendo que quieres ayuda con un cliente. Aqui tienes algunas sugerencias:

1. **Para primer contacto**: Personalize tu mensaje mencionando su industria
2. **Para seguimiento**: Ofrece valor antes de pedir algo
3. **Para cierre**: Enfocate en los beneficios especificos para su negocio

Quieres que te ayude a redactar un mensaje especifico?

*Nota: Modo desarrollo - configura AWS Bedrock para respuestas completas*"""
        elif 'comision' in message_lower or 'precio' in message_lower or 'costo' in message_lower:
            response = """Sobre comisiones de EFEX, recuerda estos puntos clave:

- Las tarifas son competitivas vs bancos tradicionales
- Hay beneficios por volumen de transacciones
- Las transferencias dentro de EFEX son gratuitas

Para detalles especificos, consulta la tabla de comisiones actualizada en tu portal.

*Nota: Modo desarrollo - configura AWS Bedrock para respuestas completas*"""
        else:
            response = mock_responses['default']

        return {
            'success': True,
            'response': response,
            'mock': True
        }

    def generate_client_message(self, message_type: str, client_info: dict) -> dict:
        """Generate a message template for a specific client"""
        prompt = f"""Genera un mensaje de {message_type} para un cliente con la siguiente informacion:

Nombre: {client_info.get('name', 'Cliente')}
Negocio: {client_info.get('business_name', 'Su negocio')}
Tipo: {client_info.get('business_type', 'No especificado')}

El mensaje debe ser profesional, personalizado y enfocado en los beneficios de EFEX."""

        return self.chat(prompt)

    def analyze_opportunity(self, client_info: dict) -> dict:
        """Analyze a client and suggest sales strategies"""
        prompt = f"""Analiza este prospecto y sugiere estrategias de venta:

Nombre: {client_info.get('name')}
Negocio: {client_info.get('business_name')}
Tipo de negocio: {client_info.get('business_type')}
Notas: {client_info.get('notes', 'Sin notas')}

Proporciona:
1. Productos EFEX mas relevantes para este cliente
2. Puntos de dolor potenciales
3. Propuesta de valor personalizada
4. Objeciones probables y como manejarlas"""

        return self.chat(prompt)


# Singleton instance
copilot_service = EFEXCopilotService()
