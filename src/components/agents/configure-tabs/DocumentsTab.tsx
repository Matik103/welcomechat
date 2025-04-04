import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DocumentUploadForm } from '@/components/client/DocumentUploadForm';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentsTabProps {
  clientId: string;
  onDocumentUpload?: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId, onDocumentUpload }) => {
  const { uploadDocument, isUploading, uploadProgress, uploadResult } = useUnifiedDocumentUpload(clientId);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(true);

  useEffect(() => {
    const fetchAssistantId = async () => {
      try {
        const { data: aiAgent, error } = await supabase
          .from('ai_agents')
          .select('openai_assistant_id')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .maybeSingle();

        if (error) {
          console.error('Error fetching assistant ID:', error);
          return;
        }

        setAssistantId(aiAgent?.openai_assistant_id || null);
      } catch (error) {
        console.error('Error in fetchAssistantId:', error);
      } finally {
        setIsLoadingAssistant(false);
      }
    };

    fetchAssistantId();
  }, [clientId]);

  const handleUpload = async (file: File) => {
    try {
      if (!assistantId) {
        return {
          success: false,
          error: 'AI Assistant not configured. Please configure the assistant first.',
          processed: 0,
          failed: 1
        };
      }

      const result = await uploadDocument(file, {
        clientId,
        shouldProcessWithOpenAI: true,
        assistantId,
        agentName: 'AI Assistant'
      });

      if (result.success && onDocumentUpload) {
        onDocumentUpload();
      }

      return result;
    } catch (error) {
      console.error('Document upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        failed: 1
      };
    }
  };

  if (isLoadingAssistant) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (!assistantId) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Assistant not configured</AlertTitle>
        <AlertDescription>
          Please configure your AI Assistant before uploading documents.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-dashed">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Upload Documents</Label>
            <DocumentUploadForm
              onSubmitDocument={handleUpload}
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
};
