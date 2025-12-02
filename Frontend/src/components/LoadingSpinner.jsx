import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingSpinner Component
 * Displays animated loading indicator
 */
const LoadingSpinner = ({ message = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
