// import { useState } from "react";

// import "./App.css";

// function App() {
//   return (
//     <>
//       <div className="shadow-emerald-950 font-serif bg-blue-400 h-20 w-full">
//         <h1 className="text-2xl flex justify-center font-bold  py-5">
//           🐥Hey there! Talk with me🔊
//         </h1>
//       </div>
//     </>
//   );
// }

// export default App;

import React, { useState, useEffect } from "react";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import VoiceInput from "./components/VoiceInput";
import ChatDisplay from "./components/ChatDisplay";
import { checkBackendHealth } from "./services/api";

function App() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
          "Cannot connect to backend server. Please make sure it is running on http://localhost:5000"
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
    if (window.confirm("Are you sure you want to clear all messages?")) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-400  shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🎤</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Voice Assistant
              </h1>
              <p className="text-xs text-gray-500">Hey there! Talk with me</p>
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
              <span className="text-xs text-gray-600">
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
                className="text-xs text-gray-600 hover:text-red-600 underline"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full mx-auto">
        {/* Chat Display */}
        <div className="flex-1 overflow-hidden">
          <ChatDisplay messages={messages} />
        </div>

        {/* Voice Input Area */}
        <div className="bg-blue-400 border-t border-gray-200 shadow-lg rounded-lg ">
          <div className="px-4 py-6">
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
            Built with React + Flask + Groq AI •
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
