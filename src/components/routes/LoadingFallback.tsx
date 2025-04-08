
import React, { useEffect, useState } from 'react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  onTimeoutAction, 
  timeoutSeconds = 5 
}) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      if (onTimeoutAction) {
        onTimeoutAction();
      }
    }, timeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [onTimeoutAction, timeoutSeconds]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      {timedOut && (
        <p className="text-sm text-muted-foreground">
          Taking longer than expected...
        </p>
      )}
    </div>
  );
};
