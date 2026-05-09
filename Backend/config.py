import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
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
    GROQ_MODEL = 'llama-3.3-70b-versatile'  
    GROQ_TEMPERATURE = 0.7
    GROQ_MAX_TOKENS = 1024
    
    @classmethod
    def init_app(cls, app):
        """set up flask app configurations and initialze it"""
        if not cls.GROQ_API_KEY:
            raise ValueError("Groq API key is not loaded from .env file")
        
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.OUTPUT_FOLDER, exist_ok=True)

        app.config.from_object(cls)

        print("Configurations initialized successfully !")



