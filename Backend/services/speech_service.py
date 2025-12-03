import speech_recognition as sr
from utils.audio_utils import convert_to_wav, delete_file


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
        # Convert audio to WAV format (required for speech recognition)
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
    
    # finally:
    #     # Cleanup: Delete temporary WAV file
    #     if wav_filepath and os.path.exists(wav_filepath):
    #         delete_file(wav_filepath)
        
    #     # Delete original uploaded file
    #     if audio_filepath and os.path.exists(audio_filepath):
    #         delete_file(audio_filepath)


def recognize_with_retry(audio_filepath, max_retries=3):
    """
    Attempt speech recognition with retries
    
    Args:
        audio_filepath: Path to audio file
        max_retries: Maximum number of retry attempts
        
    Returns:
        dict: Recognition result
    """
    for attempt in range(max_retries):
        print(f"Recognition attempt {attempt + 1}/{max_retries}")
        
        result = audio_to_text(audio_filepath)
        
        if result['success']:
            return result
        
        # If it's a service error, retry
        if 'service' in result['error'].lower():
            continue
        else:
            # If it's an audio understanding issue, don't retry
            return result
    
    # All retries failed
    return {
        'success': False,
        'text': None,
        'error': 'Speech recognition failed after multiple attempts.'
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


def recognize_with_fallback(audio_filepath, primary_language='en-US', fallback_language='hi-IN'):
    """
    Try recognition with primary language, fallback to secondary if failed
    
    Args:
        audio_filepath: Path to audio file
        primary_language: First language to try
        fallback_language: Fallback language
        
    Returns:
        dict: Recognition result
    """
    recognizer = sr.Recognizer()
    wav_filepath = None
    
    try:
        # Convert to WAV if needed
        file_ext = audio_filepath.split('.')[-1].lower()
        if file_ext != 'wav':
            wav_filepath = convert_to_wav(audio_filepath)
        else:
            wav_filepath = audio_filepath
        
        with sr.AudioFile(wav_filepath) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = recognizer.record(source)
        
        # Try primary language
        try:
            text = recognizer.recognize_google(audio_data, language=primary_language)
            if wav_filepath != audio_filepath:
                delete_file(wav_filepath)
            return {'success': True, 'text': text, 'language': primary_language}
        except sr.UnknownValueError:
            # Trying fallback language
            print(f"Primary language failed, trying {fallback_language}...")
            text = recognizer.recognize_google(audio_data, language=fallback_language)
            if wav_filepath != audio_filepath:
                delete_file(wav_filepath)
            return {'success': True, 'text': text, 'language': fallback_language}
    
    except Exception as e:
        if wav_filepath and wav_filepath != audio_filepath:
            delete_file(wav_filepath)
        return {'success': False, 'text': '', 'error': str(e)}


def get_audio_info(audio_filepath):
    """
    Get information about audio file
    
    Args:
        audio_filepath: Path to audio file
        
    Returns:
        dict: Audio file information
    """
    try:        
        with sr.AudioFile(audio_filepath) as source:
            duration = source.DURATION
            sample_rate = source.SAMPLE_RATE
            sample_width = source.SAMPLE_WIDTH
            
            return {
                'duration': duration,
                'sample_rate': sample_rate,
                'sample_width': sample_width,
                'format': audio_filepath.split('.')[-1]
            }
    
    except Exception as e:
        return {
            'error': f'Could not get audio info: {str(e)}'
        }