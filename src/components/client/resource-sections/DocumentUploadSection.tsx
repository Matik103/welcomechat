import React, { useState } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DocumentUploadSectionProps {
  clientId: string;
  logClientActivity: () => Promise<void>;
  onUploadComplete?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  clientId,
  logClientActivity,
  onUploadComplete
}) => {
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    error?: string;
    documentId?: string;
    publicUrl?: string;
  } | null>(null);
  
  const handleUploadComplete = async (result: {
    success: boolean;
    error?: string;
    documentId?: string;
    publicUrl?: string;
  }) => {
    setUploadResult(result);
    
    if (result.success) {
      await logClientActivity();
      onUploadComplete?.();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload documents to be processed by your AI Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentUpload
          clientId={clientId}
          onUploadComplete={handleUploadComplete}
        />
        
        {uploadResult && uploadResult.success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Document uploaded successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              Your document has been uploaded successfully.
              {uploadResult.publicUrl && (
                <div className="mt-2">
                  <a 
                    href={uploadResult.publicUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View document
                  </a>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {uploadResult && !uploadResult.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>
              {uploadResult.error || 'There was an error uploading your document. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
