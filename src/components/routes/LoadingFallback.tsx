
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface LoadingFallbackProps {
  onTimeoutAction?: () => void;
  timeoutSeconds?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  onTimeoutAction,
  timeoutSeconds = 10
}) => {
  const [showRetry, setShowRetry] = useState(false);
  const [timeoutCounter, setTimeoutCounter] = useState(timeoutSeconds);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // Show retry button after 3 seconds
    const retryTimer = setTimeout(() => {
      setShowRetry(true);
    }, 3000);

    // Start counting down for the auto-retry
    let countdownTimer: NodeJS.Timeout | undefined;
    
    if (onTimeoutAction) {
      countdownTimer = setInterval(() => {
        setTimeoutCounter((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            onTimeoutAction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearTimeout(retryTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [onTimeoutAction, timeoutSeconds]);

  const handleRefresh = () => {
    // Reload the page
    window.location.reload();
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg flex flex-col items-center space-y-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Loading Application</h2>
          <p className="text-muted-foreground">Please wait while we set things up...</p>
          
          {showRetry && (
            <div className="pt-4 flex flex-col items-center space-y-2">
              <p className="text-sm text-amber-600">
                This is taking longer than usual.
              </p>
              
              {onTimeoutAction && timeoutCounter > 0 && (
                <p className="text-xs text-muted-foreground">
                  Auto-continuing in {timeoutCounter} seconds...
                </p>
              )}
              
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline"
                  onClick={handleRefresh}
                  className="text-sm"
                >
                  <RefreshCw className="mr-1 w-4 h-4" />
                  Refresh Page
                </Button>

                {onTimeoutAction && (
                  <Button 
                    onClick={onTimeoutAction}
                    className="text-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Continue Anyway
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={toggleDebugInfo}
                className="text-xs text-muted-foreground mt-4"
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </Button>
              
              {showDebugInfo && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-left w-full">
                  <p className="text-xs font-mono">
                    Path: {window.location.pathname}<br />
                    User Agent: {navigator.userAgent}<br />
                    Timestamp: {new Date().toISOString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
