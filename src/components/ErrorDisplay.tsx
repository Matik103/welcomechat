
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  title: string;
  message: string;
  details?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, details }) => {
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
          <div className="overflow-auto">
            {details}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Next Steps:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Check that <code className="bg-muted p-1 rounded">VITE_SUPABASE_SERVICE_ROLE_KEY</code> is properly set in your .env file</li>
          <li>Make sure you've copied the Service Role Key (not the anon/public key) from your Supabase project</li>
          <li>Restart your development server after updating environment variables</li>
        </ul>
      </div>
    </Card>
  );
};

export default ErrorDisplay;
