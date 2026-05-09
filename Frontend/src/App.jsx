import { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import VoiceInput from "./components/VoiceInput";
import ChatDisplay from "./components/ChatDisplay";
import { checkBackendHealth, cleanupAudioFiles } from "./services/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Check if backend is connected
   */
  const checkConnection = async () => {
    try {
      const result = await checkBackendHealth();
      setBackendConnected(result.success);

      if (!result.success) {
        setError(
          "Cannot connect to backend server. Please make sure it is running on http://localhost:5000",
        );
      } else {
        setError(null);
      }
    } catch (err) {
      setBackendConnected(false);
      setError("Backend connection failed");
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Handle new messages from VoiceInput
   */
  const handleMessageSent = (userMessage, assistantMessage) => {
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setError(null);
  };

  /**
   * Handle errors
   */
  const handleError = (errorMessage) => {
    setError(errorMessage);

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  /**
   * Clear all messages
   */
  const handleClearChat = () => {
    setShowClearModal(true);
  };
  const confirmClearChat = async () => {
    setMessages([]);
    try {
      await cleanupAudioFiles();
    } catch (e) {
      console.log("Error in cleaning audio files at server", e);
      // Continue- non critical
    } finally {
      setShowClearModal(false);
    }
  };

  const cancelClear = () => {
    setShowClearModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col ">
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50
 bg-linear-to-br from-purple-500 via-blue-900 to-black  shadow-sm border-b"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🎤</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Voice Assistant</h1>
              <p className="text-xs text-gray-300">How can I help you?</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isChecking ? (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              ) : backendConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-200">
                {isChecking
                  ? "Checking..."
                  : backendConnected
                    ? "Connected"
                    : "Disconnected"}
              </span>
            </div>

            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-xs text-gray-200 hover:text-red-600 underline cursor-pointer"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-4 fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Clear All Messages?
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to clear all messages?
            </p>

            <div className="mt-5 flex justify-center gap-4">
              <button
                onClick={cancelClear}
                className="cursor-pointer px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmClearChat}
                className="cursor-pointer px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full mx-auto bg-[#132440]">
        {/* Chat Display */}
        <div className="flex-1 overflow-hidden flex items-center justify-center my-20">
          <ChatDisplay messages={messages} />
        </div>

        {/* Voice Input Area */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-linear-to-br from-black via-blue-900 to-purple-500 border-t shadow-lg ">
          <div className="p-4">
            <VoiceInput
              onMessageSent={handleMessageSent}
              onError={handleError}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 text-center text-xs text-gray-500">
          <p>
            Built with React + Flask •
            <a
              href="https://github.com/Aasthayuli/Voice_Assistant_with_Groq_API"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 ml-1"
            >
              View Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
