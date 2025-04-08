
import React, { useEffect, useState } from 'react';

export interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  onTimeoutAction, 
  timeoutSeconds = 5,
  message
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
      {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
      {timedOut && (
        <p className="text-sm text-muted-foreground">
          Taking longer than expected...
        </p>
      )}
    </div>
  );
};

export default LoadingFallback;
