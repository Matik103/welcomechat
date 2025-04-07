
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  onTimeoutAction, 
  timeoutSeconds = 10,
  message = "Loading application..."
}) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // Show a timeout message if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
      if (onTimeoutAction) {
        onTimeoutAction();
      }
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [onTimeoutAction, timeoutSeconds]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-lg font-medium text-primary">{message}</p>
        
        {showTimeoutMessage && (
          <div className="mt-4 max-w-md text-center">
            <p className="text-amber-600">Loading is taking longer than expected.</p>
            <p className="text-muted-foreground text-sm mt-2">
              This could be due to server load or network connectivity. Please wait a moment...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
