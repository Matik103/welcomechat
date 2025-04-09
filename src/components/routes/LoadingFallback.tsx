
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
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    console.log(`LoadingFallback mounted with timeout: ${timeoutSeconds}s, message: ${message}`);
    
    const mainTimer = setTimeout(() => {
      console.log("Loading timeout reached, showing timeout message");
      setTimedOut(true);
      if (onTimeoutAction) {
        console.log("Executing timeout action");
        onTimeoutAction();
      }
    }, timeoutSeconds * 1000);

    // Add a secondary timer to track elapsed time
    const intervalId = setInterval(() => {
      setSecondsElapsed(prev => {
        const next = prev + 1;
        console.log(`Loading time elapsed: ${next}s`);
        return next;
      });
    }, 1000);

    return () => {
      console.log("LoadingFallback unmounting, clearing timers");
      clearTimeout(mainTimer);
      clearInterval(intervalId);
    };
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
      {secondsElapsed > 10 && (
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
      )}
    </div>
  );
};

export default LoadingFallback;
