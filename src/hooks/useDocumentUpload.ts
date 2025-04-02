
import { useState } from 'react';
import { DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { useLlamaIndexProcessing } from './useLlamaIndexProcessing';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  const { processDocument, progress } = useLlamaIndexProcessing(clientId);

  const uploadDocument = async (file: File): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // First, get the agent name
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
      
      if (agentError) {
        console.error('Failed to get agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      // Use a default agent name if none is found
      const agentName = agentData?.name || 'AI Assistant';
      
      // Update progress based on LlamaIndex processing progress
      const progressInterval = setInterval(() => {
        setUploadProgress(progress);
      }, 200);
      
      // Process the document with LlamaIndex
      const result = await processDocument(file);
      
      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        // Create client activity with enum type
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.DOCUMENT_ADDED,
          `Document uploaded and processed: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            processed_sections: result.processed,
            failed_sections: result.failed
          }
        );
        
        setUploadResult(result);
        toast.success('Document uploaded and processed successfully');
      } else {
        setUploadResult({
          success: false,
          error: result.error,
          processed: 0,
          failed: 1
        });
        throw new Error(result.error || 'Failed to process document');
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error uploading document: ${errorMessage}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadResult
  };
}
