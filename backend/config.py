import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration base class"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///efex_promotors.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # AWS Bedrock Configuration
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_SESSION_TOKEN = os.getenv('AWS_SESSION_TOKEN')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

    # Claude Model Configuration
    # Opciones: 'anthropic.claude-3-haiku-20240307-v1:0' (rapido y economico)
    #           'us.anthropic.claude-3-5-sonnet-20241022-v2:0' (cross-region inference profile)
    CLAUDE_MODEL_ID = os.getenv('CLAUDE_MODEL_ID', 'us.anthropic.claude-3-5-sonnet-20241022-v2:0')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
