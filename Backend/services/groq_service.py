from groq import Groq
from config import Config


# Initialize Groq client
client = None

def initialize_groq_client():
    """Initialize Groq client with API key"""
    global client
    
    try:
        api_key = Config.GROQ_API_KEY
        
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Initialize Groq client
        client = Groq(api_key=api_key)
        
        print("Groq client initialized successfully")
        return True
    
    except Exception as e:
        print(f"Failed to initialize Groq client: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def get_groq_response(user_message, conversation_history=None):
    """
    Get AI response from Groq API
    
    Args:
        user_message: User's text message
        conversation_history: Optional list of previous messages
        
    Returns:
        dict: {
            'success': bool,
            'response': str (AI response),
            'error': str (if any)
        }
    """
    global client
    
    # Initialize client if not already done
    if client is None:
        if not initialize_groq_client():
            return {
                'success': False,
                'response': None,
                'error': 'Failed to initialize Groq client'
            }
    
    try:
        # Prepare messages
        messages = []
        
        if conversation_history:
            # Include conversation history
            messages.extend(conversation_history)
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        print(f"Sending request to Groq API...")
        print(f"User message: {user_message}")
        
        # Call Groq Chat Completions API
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=Config.GROQ_MODEL,
            temperature=Config.GROQ_TEMPERATURE,
            max_tokens=1024,
            top_p=1,
            stream=False
        )
        
        # Extract response text
        ai_response = chat_completion.choices[0].message.content
        
        print(f"Groq response: {ai_response}")
        
        return {
            'success': True,
            'response': ai_response,
            'error': None
        }
    
    except Exception as e:
        error_message = str(e)
        print(f"Groq API error: {error_message}")
        
        # Handle specific errors
        if "rate_limit" in error_message.lower():
            return {
                'success': False,
                'response': None,
                'error': 'Rate limit exceeded. Please try again in a moment.'
            }
        elif "api_key" in error_message.lower() or "authentication" in error_message.lower():
            return {
                'success': False,
                'response': None,
                'error': 'Invalid API key. Please check your Groq API key.'
            }
        else:
            return {
                'success': False,
                'response': None,
                'error': f'AI service error: {error_message}'
            }

def test_groq_connection():
    """
    Test Groq API connection
    
    Returns:
        bool: True if connection successful
    """
    try:
        result = get_groq_response("Hello")
        return result['success']
    except:
        return False