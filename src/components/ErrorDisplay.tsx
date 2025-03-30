
import React from 'react';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  details,
  onRetry
}) => {
  return (
    <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-red-600 font-medium">{message}</div>
        {details && (
          <div className="text-red-500 text-sm bg-red-100 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Details</span>
            </div>
            {details}
          </div>
        )}
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button 
            onClick={onRetry} 
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ErrorDisplay;
