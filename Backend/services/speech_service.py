import speech_recognition as sr
from utils.audio_utils import convert_to_wav


def audio_to_text(audio_filepath):
    """
    Convert audio file to text using Google Speech Recognition
    
    Args:
        audio_filepath: Path to audio file
        
    Returns:
        dict: {
            'success': bool,
            'text': str (transcribed text),
            'error': str (if any)
        }
    """
    recognizer = sr.Recognizer()
    wav_filepath = None
    
    try:
        # Convert audio to WAV format 
        print(f"Converting audio file: {audio_filepath}")
        wav_filepath = convert_to_wav(audio_filepath)
        
        # Load audio file
        with sr.AudioFile(wav_filepath) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            # Record audio data
            audio_data = recognizer.record(source)
            
            print("Recognizing speech...")
            
            # Recognize speech using Google Speech Recognition
            text = recognizer.recognize_google(audio_data, language='en-US')
            
            print(f"Transcribed text: {text}")
            
            return {
                'success': True,
                'text': text,
                'error': None
            }
    
    except sr.UnknownValueError:
        # Speech was unintelligible
        print("Could not understand audio")
        return {
            'success': False,
            'text': None,
            'error': 'Could not understand the audio. Please speak clearly.'
        }
    
    except sr.RequestError as e:
        # API request failed
        print(f"Speech recognition service error: {e}")
        return {
            'success': False,
            'text': None,
            'error': 'Speech recognition service is unavailable. Please try again later.'
        }
    
    except Exception as e:
        # Other errors
        print(f"Error in speech recognition: {str(e)}")
        return {
            'success': False,
            'text': None,
            'error': f'Speech recognition failed: {str(e)}'
        }


def validate_transcription(text):
    """
    Validate transcribed text
    
    Args:
        text: Transcribed text
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not text or len(text.strip()) == 0:
        return False, "No speech detected in audio"
    
    if len(text) < 2:
        return False, "Speech too short to process"
    
    if len(text) > 500:
        return False, "Speech too long. Please keep it under 500 characters."
    
    return True, None
