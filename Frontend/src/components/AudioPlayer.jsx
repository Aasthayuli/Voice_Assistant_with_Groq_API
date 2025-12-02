import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

/**
 * AudioPlayer Component
 * Plays AI response audio with controls
 */
const AudioPlayer = ({ audioUrl, autoPlay = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      // Load new audio
      audioRef.current.load();

      if (autoPlay) {
        // Auto-play with a small delay
        setTimeout(() => {
          audioRef.current?.play().catch((err) => {
            console.error("Auto-play failed:", err);
          });
        }, 100);
      }
    }
  }, [audioUrl, autoPlay]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3 mt-2">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-gray-600 font-mono min-w-[35px]">
          {formatTime(currentTime)}
        </span>

        <div
          className="flex-1 h-2 bg-gray-300 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <span className="text-xs text-gray-600 font-mono min-w-[35px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      >
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
};

export default AudioPlayer;
