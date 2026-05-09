import os
from gtts import gTTS
from datetime import datetime
from config import Config


def text_to_speech(text, language='en', slow=False):
    """
    Convert text to speech audio file using Google Text-to-Speech
    
    Args:
        text: Text to convert to speech
        language: Language code (default: 'en' for English)
        slow: Whether to use slow speech speed
        
    Returns:
        dict: {
            'success': bool,
            'audio_path': str (path to audio file),
            'audio_url': str (URL to access audio),
            'error': str (if any)
        }
    """
    try:
        # Validate input
        if not text or len(text.strip()) == 0:
            return {
                'success': False,
                'audio_path': None,
                'audio_url': None,
                'error': 'No text provided for speech synthesis'
            }
        
        # Create output folder if not exists
        os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"response_{timestamp}.mp3"
        audio_path = os.path.join(Config.OUTPUT_FOLDER, filename)
        
        print(f"Generating speech for text: {text[:50]}...")
        
        # Create gTTS object
        tts = gTTS(text=text, lang=language, slow=slow)
        
        # Save audio file
        tts.save(audio_path)
        
        print(f"Audio saved to: {audio_path}")
        
        # Generate URL for frontend to access
        # Format: /static/audio/outputs/response_20240101_120000.mp3
        audio_url = f"/static/audio/outputs/{filename}"
        
        return {
            'success': True,
            'audio_path': audio_path,
            'audio_url': audio_url,
            'error': None
        }
    
    except Exception as e:
        print(f"Text-to-speech error: {str(e)}")
        return {
            'success': False,
            'audio_path': None,
            'audio_url': None,
            'error': f'Speech synthesis failed: {str(e)}'
        }

def cleanup_audio_files():
    """
    Clean up old audio files from output folder
    
    Args:
        max_age_hours: Delete files older than this many hours
    """
    try:
        from utils.audio_utils import cleanup_old_files
        
        # Cleanup output folder
        cleanup_old_files(Config.OUTPUT_FOLDER)
        
        # Cleanup upload folder
        cleanup_old_files(Config.UPLOAD_FOLDER)
        
        print(f"Cleaned up audio files !")
    
    except Exception as e:
        print(f"Cleanup error: {str(e)}")


def validate_text_length(text, max_length=500):
    """
    Validate text length for TTS
    
    Args:
        text: Input text
        max_length: Maximum allowed length
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(text) > max_length:
        return False, f"Text too long. Maximum {max_length} characters allowed."
    
    return True, None
