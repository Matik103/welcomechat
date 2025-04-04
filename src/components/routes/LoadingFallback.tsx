
import React, { useState } from 'react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  onTimeoutAction,
  timeoutSeconds = 10
}) => {
  // Simplified component - removed timers and UI elements that were causing confusion
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg flex flex-col items-center space-y-6">
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading Application</h2>
          <p className="text-muted-foreground">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};
