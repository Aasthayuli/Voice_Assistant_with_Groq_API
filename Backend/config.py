import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Server settings
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # API Keys
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    
    # Audio settings
    MAX_AUDIO_SIZE = int(os.getenv('MAX_AUDIO_SIZE', 10485760))  # 10MB
    ALLOWED_AUDIO_FORMATS = os.getenv('ALLOWED_AUDIO_FORMATS', 'wav,mp3,webm,ogg,m4a').split(',')
    MAX_AUDIO_DURATION = int(os.getenv('MAX_AUDIO_DURATION', 60))  # seconds
    
    # File paths
    UPLOAD_FOLDER = os.getenv('AUDIO_UPLOAD_FOLDER', 'static/audio/uploads')
    OUTPUT_FOLDER = os.getenv('AUDIO_OUTPUT_FOLDER', 'static/audio/outputs')
    
    # API settings
    API_TIMEOUT = int(os.getenv('API_TIMEOUT', 30))
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # Groq Model settings
    GROQ_MODEL = 'mixtral-8x7b-32768'  # Fast and efficient model
    GROQ_TEMPERATURE = 0.7
    GROQ_MAX_TOKENS = 1024
    
    @staticmethod
    def validate_config():
        """Validate required configuration"""
        if not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in .env file")
        
        # Create necessary directories
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
        
        return True


class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    
    # Override with more secure settings for production
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')


class TestingConfig(Config):
    """Testing environment configuration"""
    DEBUG = True
    TESTING = True
    
    # Use temporary directories for testing
    UPLOAD_FOLDER = 'tests/temp/uploads'
    OUTPUT_FOLDER = 'tests/temp/outputs'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration based on environment"""
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    
    return config.get(env, config['default'])