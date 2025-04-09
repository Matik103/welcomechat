
import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [extendedTimeout, setExtendedTimeout] = useState(false);

  // Show a timeout message if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
      if (onTimeoutAction) {
        onTimeoutAction();
      }
    }, timeoutSeconds * 1000);

    // Extended timeout for longer waits
    const extendedTimer = setTimeout(() => {
      setExtendedTimeout(true);
    }, (timeoutSeconds + 10) * 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(extendedTimer);
    };
  }, [onTimeoutAction, timeoutSeconds]);

  const handleManualRefresh = () => {
    window.location.reload();
  };

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
            {extendedTimeout && (
              <div className="mt-4">
                <Button variant="outline" onClick={handleManualRefresh} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  If you keep seeing this message, try refreshing the page or checking your network connection.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
