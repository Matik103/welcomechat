
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, details, onRetry }) => {
  return (
    <Card className="p-6 max-w-4xl mx-auto my-8">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-medium">{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      
      {details && (
        <div className="mt-4 text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap">
          <h4 className="font-semibold mb-2">Technical Details:</h4>
          <div className="overflow-auto max-h-60">
            {details}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Next Steps:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check that all required environment variables are properly set</li>
          <li>Verify your network connection to the backend services</li>
          <li>Refresh and try again</li>
        </ul>
      </div>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          className="mt-4"
        >
          Retry
        </Button>
      )}
    </Card>
  );
};

export default ErrorDisplay;
