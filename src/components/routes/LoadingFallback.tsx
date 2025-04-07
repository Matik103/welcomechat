
import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  onTimeoutAction,
  timeoutSeconds = 3, // Reduced from 5 to 3 seconds
  message = "Loading..."
}) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowTimeoutMessage(true);
      if (onTimeoutAction) {
        onTimeoutAction();
      }
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timeoutId);
  }, [onTimeoutAction, timeoutSeconds]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center">
        {!showTimeoutMessage && (
          <>
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">{message}</p>
          </>
        )}
        
        {showTimeoutMessage && (
          <div className="mt-4 text-center">
            <p className="text-muted-foreground">
              Taking longer than expected. You can try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
