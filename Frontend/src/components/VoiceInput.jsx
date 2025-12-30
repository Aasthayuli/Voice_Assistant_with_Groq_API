import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import {
  startRecording,
  stopRecording,
  cancelRecording,
  checkMicrophoneSupport,
  isRecording,
} from "../utils/audiorecorder";
import { sendVoiceMessage, getAudioUrl } from "../services/api";

/**
 * VoiceInput Component
 * Main microphone button with recording functionality
 */
const VoiceInput = ({ onMessageSent, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micSupported, setMicSupported] = useState(true);

  // Check microphone support on mount
  useEffect(() => {
    const supported = checkMicrophoneSupport();
    setMicSupported(supported);

    if (!supported) {
      onError?.("Your browser does not support microphone access");
    }
  }, []);

  // Recording timer
  useEffect(() => {
    let interval;

    if (isListening) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  /**
   * Start recording audio
   */
  const handleStartRecording = async () => {
    try {
      console.log("Starting recording...");

      const result = await startRecording();

      if (result.success) {
        setIsListening(true);
        console.log("Recording started successfully");
      } else {
        onError?.(result.error || "Failed to start recording");
      }
    } catch (error) {
      console.error("Start recording error:", error);
      onError?.(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  /**
   * Stop recording and send to backend
   */
  const handleStopRecording = async () => {
    try {
      console.log("Stopping recording...");
      setIsListening(false);
      setIsProcessing(true);

      // Stop recording and get audio blob
      const result = await stopRecording();

      if (!result.success || !result.audioBlob) {
        throw new Error("Failed to get audio recording");
      }

      console.log("Recording stopped, blob size:", result.audioBlob.size);

      // Check blob size
      if (result.audioBlob.size < 1000) {
        throw new Error(
          "Recording too short. Please speak for at least 1 second."
        );
      }

      // Send to backend
      await sendAudioToBackend(result.audioBlob);
    } catch (error) {
      console.error("Stop recording error:", error);
      onError?.(error.message || "Failed to process recording");
      setIsProcessing(false);
    }
  };

  /**
   * Send audio blob to backend API
   */
  const sendAudioToBackend = async (audioBlob) => {
    try {
      console.log("Sending audio to backend...");

      // Call API
      const response = await sendVoiceMessage(audioBlob);

      if (response.success && response.data) {
        const {
          transcription,
          response: aiResponse,
          audio_url,
          timestamp,
        } = response.data;

        console.log("Backend response:", {
          transcription,
          aiResponse,
          audio_url,
        });

        // Create user message
        const userMessage = {
          role: "user",
          content: transcription,
          timestamp: timestamp || new Date().toISOString(),
        };

        // Create AI message
        const assistantMessage = {
          role: "assistant",
          content: aiResponse,
          audioUrl: audio_url ? getAudioUrl(audio_url) : null,
          timestamp: timestamp || new Date().toISOString(),
        };

        // Send both messages to parent
        onMessageSent?.(userMessage, assistantMessage);
      } else {
        throw new Error(response.error || "Failed to process voice message");
      }
    } catch (error) {
      console.error("Send audio error:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle mic button click
   */
  const handleMicClick = () => {
    if (isProcessing) return; // Ignore if processing

    if (isListening) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  /**
   * Cancel recording
   */
  const handleCancel = () => {
    cancelRecording();
    setIsListening(false);
    setIsProcessing(false);
    setRecordingTime(0);
  };

  /**
   * Format recording time
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!micSupported) {
    return (
      <div className="text-center text-red-500 text-sm">
        Microphone not supported in your browser
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Recording Indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-red-500 animate-pulse">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-medium">
            Recording... {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-primary-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-medium">Processing your voice...</span>
        </div>
      )}

      {/* Microphone Button */}
      <div className="relative">
        {/* Animated rings when recording */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-red-300 animate-pulse"></div>
          </>
        )}

        {/* Main Button */}
        <button
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`bg-white relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isListening
              ? "bg-red-500 hover:bg-red-600 shadow-glow scale-110"
              : isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600 shadow-glow hover:scale-105"
          }`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-8 h-8 text-white cursor-pointer" />
          ) : (
            <Mic className="w-8 h-8 text-black cursor-pointer" />
          )}
        </button>
      </div>

      {/* Cancel Button (when recording) */}
      {isListening && (
        <button
          onClick={handleCancel}
          className="text-sm text-gray-200 hover:text-gray-800 underline"
        >
          Cancel
        </button>
      )}

      {/* Instructions */}
      {!isListening && !isProcessing && (
        <p className="text-sm text-gray-200 text-center">Click to speak</p>
      )}
    </div>
  );
};

export default VoiceInput;
