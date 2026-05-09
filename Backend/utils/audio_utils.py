import os
from datetime import datetime
from pydub import AudioSegment
from config import Config


def validate_audio_file(file):
    """
    Validate uploaded audio file
    
    Args:
        file: FileStorage object from Flask request
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not file:
        return False, "No audio file provided"
    
    if file.filename == '':
        return False, "Empty filename"
    
    # Check file extension
    file_ext = file.filename.rsplit('.', 1)[-1].lower()
    if file_ext not in Config.ALLOWED_AUDIO_FORMATS:
        return False, f"Invalid format. Allowed: {', '.join(Config.ALLOWED_AUDIO_FORMATS)}"
    
    # Check file size (read in memory to check)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset pointer
    
    if file_size > Config.MAX_AUDIO_SIZE:
        return False, f"File too large. Max size: {Config.MAX_AUDIO_SIZE / 1024 / 1024}MB"
    
    if file_size == 0:
        return False, "Empty audio file"
    
    return True, None


def save_audio_file(file, folder=None):
    """
    Save uploaded audio file to disk
    """
    if folder is None:
        folder = Config.UPLOAD_FOLDER
    
    # Create folder if not exists
    os.makedirs(folder, exist_ok=True)
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    original_filename = file.filename
    file_ext = original_filename.rsplit('.', 1)[-1].lower()
    filename = f"audio_{timestamp}.{file_ext}"
    
    filepath = os.path.join(folder, filename)
    
    print(f"Saving file to: {filepath}")
    print(f"Absolute path: {os.path.abspath(filepath)}")
    print(f"Folder exists: {os.path.exists(folder)}")
    
    # Save file
    try:
        file.save(filepath)
        print(f"File saved successfully")
        
        # Verify file exists
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"File verified! Size: {file_size} bytes")
        else:
            print(f"File NOT found after save!")
        
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        raise
    
    return filepath


def convert_to_wav(input_path, output_path=None):
    """
    Convert audio file to WAV format for speech recognition
    
    Args:
        input_path: Path to input audio file
        output_path: Optional output path
        
    Returns:
        str: Path to WAV file
    """
    try:
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Convert to WAV with proper settings for speech recognition
        audio = audio.set_frame_rate(16000)  # 16kHz sample rate
        audio = audio.set_channels(1)  # Mono
        audio = audio.set_sample_width(2)  # 16-bit
        
        # Generate output path if not provided
        if output_path is None:
            base_name = os.path.splitext(input_path)[0]
            output_path = f"{base_name}_converted.wav"
        
        # Export as WAV
        audio.export(output_path, format='wav')
        
        return output_path
    
    except Exception as e:
        raise Exception(f"Audio conversion failed: {str(e)}")


def get_audio_duration(filepath):
    """
    Get duration of audio file in seconds
    
    Args:
        filepath: Path to audio file
        
    Returns:
        float: Duration in seconds
    """
    try:
        audio = AudioSegment.from_file(filepath)
        duration = len(audio) / 1000.0  # Convert milliseconds to seconds
        return duration
    except Exception as e:
        raise Exception(f"Could not get audio duration: {str(e)}")


def validate_audio_duration(filepath):
    """
    Check if audio duration is within allowed limits
    
    Args:
        filepath: Path to audio file
        
    Returns:
        tuple: (is_valid, duration)
    """
    try:
        duration = get_audio_duration(filepath)
        
        if duration > Config.MAX_AUDIO_DURATION:
            return False, duration
        
        return True, duration
    
    except Exception as e:
        return False, 0


def cleanup_old_files(folder):
    """
    Delete audio files older than specified hours
    
    Args:
        folder: Folder to clean
        max_age_hours: Maximum age in hours
    """
    try:
        if not os.path.exists(folder):
            return
        
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            
            # Skip if not a file
            if not os.path.isfile(filepath):
                continue
            os.remove(filepath)
            print(f"Deleted old file: {filename}")
    
    except Exception as e:
        print(f"Cleanup error: {str(e)}")


def delete_file(filepath):
    """
    Safely delete a file
    
    Args:
        filepath: Path to file
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {filepath}: {str(e)}")
        return False