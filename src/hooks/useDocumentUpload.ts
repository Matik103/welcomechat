
import { useState } from 'react';
import { DocumentProcessingService } from '@/utils/DocumentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);

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
        .single();
      
      if (agentError) {
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      const agentName = agentData?.name || 'AI Assistant';
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      // Process the document - pass just the file and clientId
      const result = await DocumentProcessingService.processDocument(
        file,
        clientId
      );
      
      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        // Create client activity with correct parameter order and enum type
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.DOCUMENT_ADDED,  // Using enum instead of string description
          `Document uploaded: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type
          }
        );
        
        setUploadResult(result);
        toast.success('Document uploaded successfully');
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
      toast.error(`Error uploading document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
