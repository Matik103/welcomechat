
import { useState } from 'react';
import { DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { useLlamaIndexProcessing } from './useLlamaIndexProcessing';
import { v4 as uuidv4 } from 'uuid';

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
      // First, get the agent name - ensure it's fetched properly
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
      
      if (!agentData || !agentData.name) {
        throw new Error('Agent name not found for this client');
      }
      
      const agentName = agentData.name;
      console.log("Using agent name for document upload:", agentName);
      
      // Update progress based on LlamaIndex processing progress
      const progressInterval = setInterval(() => {
        setUploadProgress(progress);
      }, 200);
      
      console.log("Starting LlamaIndex document processing for file:", file.name);
      
      try {
        // Process the document with LlamaIndex
        const result = await processDocument(file);
        
        console.log("LlamaIndex processing result:", result);
        
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
              failed_sections: result.failed,
              processed_with: 'llamaindex',
              document_id: result.documentId
            }
          );
          
          setUploadResult(result);
          toast.success('Document uploaded and processed successfully');
        } else {
          console.error("Document processing failed:", result.error);
          setUploadResult({
            success: false,
            error: result.error || 'Failed to process document',
            processed: 0,
            failed: 1,
            documentId: result.documentId
          });
          throw new Error(result.error || 'Failed to process document');
        }
      } catch (processingError) {
        console.error("Error in document processing:", processingError);
        clearInterval(progressInterval);
        setUploadProgress(100);  // Set to 100 to indicate processing is complete, even if failed
        
        const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
        setUploadResult({
          success: false,
          error: errorMessage,
          processed: 0,
          failed: 1,
          documentId: uuidv4() // Generate a new document ID for the error case
        });
        
        throw new Error(errorMessage);
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
