import React, { useEffect, useRef } from "react";
import { User, Bot } from "lucide-react";
import AudioPlayer from "./AudioPlayer";

/**
 * ChatDisplay Component
 * Displays conversation history with user and AI messages
 */
const ChatDisplay = ({ messages }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex justify-center mt-10">
        <div className="text-center text-gray-500 space-y-2">
          <Bot className="w-16 h-16 mx-auto text-gray-300" />
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Click the microphone to speak</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-5xl mx-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {/* AI Avatar (left side) */}
          {message.role === "assistant" && (
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              message.role === "user"
                ? "bg-primary-500 text-white"
                : "bg-gray-900 text-gray-200"
            }`}
          >
            {/* Message Text */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>

            {/* Audio Player (for AI responses) */}
            {message.role === "assistant" && message.audioUrl && (
              <AudioPlayer audioUrl={message.audioUrl} autoPlay={true} />
            )}

            {/* Timestamp */}
            <p
              className={`text-xs mt-2 ${
                message.role === "user" ? "text-primary-100" : "text-gray-500"
              }`}
            >
              {formatTimestamp(message.timestamp)}
            </p>
          </div>

          {/* User Avatar (right side) */}
          {message.role === "user" && (
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      ))}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatDisplay;
