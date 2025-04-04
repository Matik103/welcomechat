
import React from 'react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = () => {
  // Simplified component with minimal UI to avoid intrusive loading states
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
