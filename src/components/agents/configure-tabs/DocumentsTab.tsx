
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentLinks } from '@/components/client/DocumentLinks';

interface DocumentsTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function DocumentsTab({ clientId, agentName, onSuccess }: DocumentsTabProps) {
  const logClientActivity = async () => {
    // This is a placeholder; in a real implementation, you'd log the activity
    console.log('Document interaction logged for client:', clientId);
    return Promise.resolve();
  };

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload documents to provide knowledge for the AI agent. Supported formats include PDF, DOCX, and text files.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="pt-6">
          <DocumentLinks 
            clientId={clientId} 
            onResourceChange={onSuccess}
            logClientActivity={logClientActivity}
            onUploadComplete={onSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
