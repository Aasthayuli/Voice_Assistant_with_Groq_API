// Audio Recorder Utility
// Handles microphone recording using MediaRecorder API

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

/**
 * Check if browser supports audio recording
 */
export const checkMicrophoneSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Request microphone permission and get audio stream
 */
export const getAudioStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });

    audioStream = stream;
    return { success: true, stream };
  } catch (error) {
    console.error("Microphone access error:", error);

    let errorMessage = "Could not access microphone";

    if (error.name === "NotAllowedError") {
      errorMessage =
        "Microphone permission denied. Please allow microphone access.";
    } else if (error.name === "NotFoundError") {
      errorMessage = "No microphone found. Please connect a microphone.";
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Start recording audio
 */
export const startRecording = async () => {
  try {
    // Get audio stream
    const streamResult = await getAudioStream();

    if (!streamResult.success) {
      return streamResult;
    }

    // Reset audio chunks
    audioChunks = [];

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(streamResult.stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    // Store audio data as it's recorded
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // Start recording
    mediaRecorder.start();

    console.log("Recording started");

    return { success: true };
  } catch (error) {
    console.error("Recording start error:", error);
    return { success: false, error: "Failed to start recording" };
  }
};

/**
 * Stop recording and return audio blob
 */
export const stopRecording = () => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      reject(new Error("No active recording"));
      return;
    }

    mediaRecorder.onstop = () => {
      // Create blob from recorded chunks
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

      // Stop all audio tracks
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }

      console.log("Recording stopped, blob size:", audioBlob.size);

      resolve({ success: true, audioBlob });
    };

    mediaRecorder.onerror = (error) => {
      reject(error);
    };

    // Stop recording
    mediaRecorder.stop();
  });
};

/**
 * Cancel recording without returning blob
 */
export const cancelRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
  }

  audioChunks = [];
  mediaRecorder = null;
  audioStream = null;
};

/**
 * Get current recording state
 */
export const getRecordingState = () => {
  return mediaRecorder ? mediaRecorder.state : "inactive";
};

/**
 * Check if currently recording
 */
export const isRecording = () => {
  return mediaRecorder && mediaRecorder.state === "recording";
};
