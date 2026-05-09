// API Service - Axios configuration and API calls
import axios from "axios";

// Backend API base URL
const API_BASE_URL = "http://localhost:5000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - logs all requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - handles errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("Response error:", error);

    if (error.response) {
      // Server responded with error status
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
    } else if (error.request) {
      // Request was made but no response
      console.error("No response received");
    } else {
      // Error in request setup
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  },
);

/**
 * Send voice message to backend
 * @param {Blob} audioBlob - Recorded audio blob
 * @returns {Promise} API response with transcription and AI response
 */
export const sendVoiceMessage = async (audioBlob) => {
  try {
    // Create FormData to send audio file
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    console.log("Sending audio blob, size:", audioBlob.size);

    // Send POST request
    const response = await apiClient.post("/api/process_voice", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Send voice error:", error);

    let errorMessage = "Failed to process voice message";

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Request timeout. Please try again.";
    } else if (error.message === "Network Error") {
      errorMessage =
        "Cannot connect to server. Please check if backend is running.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Check backend health
 * @returns {Promise} Health status
 */
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get("/api/health");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      success: false,
      error: "Backend is not responding",
    };
  }
};

/**
 * Get audio URL for playback
 * @param {string} audioUrl - Relative audio URL from backend
 * @returns {string} Full audio URL
 */
export const getAudioUrl = (audioUrl) => {
  if (!audioUrl) return null;

  // If already full URL, return as is
  if (audioUrl.startsWith("http")) {
    return audioUrl;
  }

  // Otherwise, prepend base URL
  return `${API_BASE_URL}${audioUrl}`;
};

/**
 * Trigger cleanup of old audio files
 * @returns {Promise} Cleanup result
 */
export const cleanupAudioFiles = async () => {
  try {
    const response = await apiClient.post("/api/cleanup");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      success: false,
      error: "Failed to cleanup files",
    };
  }
};

export default apiClient;
