
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LoadingFallback = () => {
  const [isLongLoading, setIsLongLoading] = useState(false);
  
  useEffect(() => {
    // Set a timeout to detect long loading times
    const timeoutId = setTimeout(() => {
      setIsLongLoading(true);
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground mb-2">Loading application...</p>
        
        {isLongLoading && (
          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center text-amber-600 mb-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p className="text-sm font-medium">Loading is taking longer than expected</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
