
import React from 'react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = () => {
  // Minimalist loading component with no timeout messages
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
