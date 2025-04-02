
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DocumentUploadForm } from '@/components/client/DocumentUploadForm';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DocumentsTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function DocumentsTab({ clientId, agentName, onSuccess }: DocumentsTabProps) {
  const { uploadDocument, isUploading, uploadProgress, uploadResult } = useUnifiedDocumentUpload(clientId);

  const handleSubmitDocument = async (file: File) => {
    try {
      // Use the unified document upload with all sync options enabled
      await uploadDocument(file, {
        shouldUseAI: true,
        syncToAgent: true,
        syncToProfile: true,
        syncToWidgetSettings: true
      });
      
      // Create client activity
      await createClientActivity(
        clientId,
        agentName,
        ActivityType.DOCUMENT_ADDED,
        `Document uploaded for agent ${agentName}: ${file.name}`,
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          agent_name: agentName
        }
      );
      
      toast.success(`Document uploaded successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-dashed">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Upload Documents</Label>
            <DocumentUploadForm
              onSubmitDocument={handleSubmitDocument}
              isUploading={isUploading}
            />
          </div>
          
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
                Your document has been uploaded and processed.
                {uploadResult.processed > 0 && (
                  <span> Successfully processed {uploadResult.processed} sections.</span>
                )}
                {uploadResult.failed > 0 && (
                  <span className="text-amber-600"> Failed to process {uploadResult.failed} sections.</span>
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
        </div>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <p>Documents uploaded here will be used to train your AI assistant.</p>
        <p className="mt-2">The content will be added to the agent's knowledge base and synchronized with other systems automatically.</p>
      </div>
    </div>
  );
}
