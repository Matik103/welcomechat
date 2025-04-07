
import React, { useState, useEffect } from 'react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  onTimeoutAction,
  timeoutSeconds = 5
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
