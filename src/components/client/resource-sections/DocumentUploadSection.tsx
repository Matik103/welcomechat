import React from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { DocumentProcessingResult } from '@/types/document-processing';

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
  const { uploadDocument, isUploading, uploadProgress, uploadResult } = useUnifiedDocumentUpload(clientId);
  
  const handleUpload = async (file: File): Promise<DocumentProcessingResult> => {
    try {
      console.log("Starting document upload process for:", file.name);
      const result = await uploadDocument(file, { 
        clientId,
        shouldProcessWithOpenAI: true,
        agentName: 'AI Assistant'
      });

      if (result.success) {
        await logClientActivity();
        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      return {
        success: result.success,
        documentId: result.documentId?.toString(),
        error: result.error,
        processed: result.processed || 0,
        failed: result.failed || 0
      };
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1
      };
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
          uploadDocument={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress < 90 ? 'Uploading document...' : 'Processing document...'}
              </span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
            <p className="text-xs text-gray-500 mt-1">
              {uploadProgress < 50 ? 'Uploading your document...' : 'Your document is being processed. This may take a few moments...'}
            </p>
          </div>
        )}
        
        {uploadResult && uploadResult.success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Document processed successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              Your document "{uploadResult.fileName}" has been uploaded and processed. 
              {uploadResult.processed > 0 && (
                <span> Successfully processed {uploadResult.processed} sections.</span>
              )}
              {uploadResult.failed > 0 && (
                <span className="text-amber-600"> Failed to process {uploadResult.failed} sections.</span>
              )}
              {uploadResult.documentUrl && (
                <div className="mt-2">
                  <a 
                    href={uploadResult.documentUrl} 
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
              {uploadResult.error || 'There was an error processing your document. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
