from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from datetime import datetime

# Import configuration
from config import Config, get_config

# Import services
from services.speech_service import audio_to_text, validate_transcription
from services.groq_service import get_groq_response, initialize_groq_client, test_groq_connection
from services.tts_service import text_to_speech, cleanup_audio_files

# Import utilities
from utils.audio_utils import validate_audio_file, save_audio_file, get_audio_duration


def create_app(config_name='development'):
    """Create and configure Flask application"""
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(get_config(config_name))
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": Config.CORS_ORIGINS,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Validate configuration
    try:
        Config.validate_config()
        print("Configuration validated successfully")
    except Exception as e:
        print(f"Configuration error: {str(e)}")
        return None
    
    # Initialize Groq client
    if initialize_groq_client():
        print("Groq client initialized")
    else:
        print("Warning: Groq client initialization failed")
    
    # Create necessary directories
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
    
    
    # ============================================
    # ROUTES
    # ============================================
    
    @app.route('/')
    def index():
        """Root endpoint - API information"""
        return jsonify({
            'service': 'Voice Assistant API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'process_voice': '/api/process_voice (POST)',
                'test_groq': '/api/test_groq'
            }
        })
    
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        
        # Test Groq connection
        groq_status = test_groq_connection()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'flask': 'running',
                'groq': 'connected' if groq_status else 'disconnected',
                'speech_recognition': 'available',
                'text_to_speech': 'available'
            }
        })
    
    
    @app.route('/api/process_voice', methods=['POST'])
    def process_voice():
        """
        Main endpoint: Process voice input and return AI response
        
        Expected: audio file in 'audio' field
        Returns: JSON with transcription, AI response, and audio URL
        """
        
        try:
            # Check if audio file is present
            if 'audio' not in request.files:
                return jsonify({
                    'success': False,
                    'error': 'No audio file provided'
                }), 400
            
            audio_file = request.files['audio']
            
            # Validate audio file
            is_valid, error_msg = validate_audio_file(audio_file)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
            
            print(f"Received audio file: {audio_file.filename}")
            
            # Save audio file
            audio_path = save_audio_file(audio_file)
            print(f"Audio saved to: {audio_path}")
            
            # Check audio duration
            try:
                duration = get_audio_duration(audio_path)
                print(f"Audio duration: {duration:.2f} seconds")
                
                if duration > Config.MAX_AUDIO_DURATION:
                    return jsonify({
                        'success': False,
                        'error': f'Audio too long. Maximum {Config.MAX_AUDIO_DURATION} seconds allowed.'
                    }), 400
            except Exception as e:
                print(f"Could not check duration: {str(e)}")
            
            # Step 1: Convert audio to text (Speech Recognition)
            print("Converting speech to text...")
            speech_result = audio_to_text(audio_path)
            
            if not speech_result['success']:
                return jsonify({
                    'success': False,
                    'error': speech_result['error']
                }), 400
            
            user_text = speech_result['text']
            print(f"Transcribed: {user_text}")
            
            # Validate transcription
            is_valid, error_msg = validate_transcription(user_text)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
            
            # Step 2: Get AI response from Groq
            print("Getting AI response...")
            groq_result = get_groq_response(user_text)
            
            if not groq_result['success']:
                return jsonify({
                    'success': False,
                    'error': groq_result['error']
                }), 500
            
            ai_response = groq_result['response']
            print(f"AI Response: {ai_response}")
            
            # Step 3: Convert AI response to speech (Text-to-Speech)
            print("Converting text to speech...")
            tts_result = text_to_speech(ai_response)
            
            if not tts_result['success']:
                # If TTS fails, still return text response
                print(f"TTS failed: {tts_result['error']}")
                return jsonify({
                    'success': True,
                    'transcription': user_text,
                    'response': ai_response,
                    'audio_url': None,
                    'warning': 'Audio generation failed, text response provided'
                })
            
            audio_url = tts_result['audio_url']
            print(f"Audio generated: {audio_url}")
            
            # Return complete response
            return jsonify({
                'success': True,
                'transcription': user_text,
                'response': ai_response,
                'audio_url': audio_url,
                'timestamp': datetime.now().isoformat()
            })
        
        except Exception as e:
            print(f"Error in process_voice: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Server error: {str(e)}'
            }), 500
    
    
    @app.route('/api/test_groq', methods=['GET'])
    def test_groq_endpoint():
        """Test Groq API connection"""
        
        if test_groq_connection():
            return jsonify({
                'success': True,
                'message': 'Groq API connection successful'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Groq API connection failed'
            }), 500
    
    
    @app.route('/static/audio/outputs/<filename>')
    def serve_audio(filename):
        """Serve generated audio files"""
        return send_from_directory(Config.OUTPUT_FOLDER, filename)
    
    
    @app.route('/api/cleanup', methods=['POST'])
    def cleanup_endpoint():
        """Manually trigger cleanup of old audio files"""
        try:
            cleanup_audio_files(max_age_hours=24)
            return jsonify({
                'success': True,
                'message': 'Cleanup completed successfully'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    
    # ============================================
    # ERROR HANDLERS
    # ============================================
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'success': False,
            'error': 'Endpoint not found'
        }), 404
    
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
    
    
    @app.errorhandler(413)
    def file_too_large(error):
        """Handle file too large errors"""
        return jsonify({
            'success': False,
            'error': 'File too large'
        }), 413
    
    
    # ============================================
    # STARTUP
    # ============================================
    
    @app.before_request
    def log_request():
        """Log all incoming requests"""
        print(f"{request.method} {request.path}")
    
    
    return app


# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    app = create_app()
    
    if app:
        print("\n" + "="*50)
        print("Voice Assistant Backend Server")
        print("="*50)
        print(f"Running on: http://{Config.HOST}:{Config.PORT}")
        print(f"Environment: {Config.FLASK_ENV}")
        print(f"CORS enabled for: {Config.CORS_ORIGINS}")
        print("="*50 + "\n")
        
        # Run Flask app
        app.run(
            host=Config.HOST,
            port=Config.PORT,
            debug=Config.DEBUG
        )
    else:
        print("Failed to create Flask app. Check configuration.")