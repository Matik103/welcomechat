
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export interface DocumentProcessingOptions {
  agentName?: string;
  contentFormat?: 'markdown' | 'html' | 'text';
  processingMethod?: 'auto' | 'llama' | 'firecrawl';
}

export function useDocumentProcessor() {
  const queryClient = useQueryClient();

  const processDocumentMutation = useMutation({
    mutationFn: async ({
      clientId,
      documentUrl,
      documentType,
      options = {}
    }: {
      clientId: string;
      documentUrl: string;
      documentType: string;
      options?: DocumentProcessingOptions;
    }): Promise<DocumentProcessingResult> => {
      try {
        const documentId = uuidv4();
        const agentName = options.agentName || 'AI Assistant';
        const now = new Date().toISOString();

        // Insert a record to track the processing job
        const { error: insertError } = await supabase
          .from('document_processing_jobs')
          .insert({
            document_id: documentId,
            client_id: clientId,
            document_url: documentUrl,
            document_type: documentType,
            agent_name: agentName,
            status: 'pending',
            created_at: now,
            updated_at: now,
            metadata: {
              content_format: options.contentFormat || 'markdown',
              processing_method: options.processingMethod || 'auto'
            }
          });

        if (insertError) {
          throw new Error(`Failed to create processing job: ${insertError.message}`);
        }

        // For this implementation, we'll simulate starting a background job
        // In a real implementation, you might call an edge function or webhook
        
        // Call client activity logging
        await supabase
          .from('client_activities')
          .insert({
            client_id: clientId,
            activity_type: 'document_added',
            description: `Document added for processing: ${documentUrl}`,
            created_at: now,
            metadata: {
              document_id: documentId,
              document_type: documentType
            }
          });

        return {
          success: true,
          documentId
        };
      } catch (error) {
        console.error('Error in document processing:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['documentLinks', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['documentProcessingJobs', variables.clientId] });
    }
  });

  // Also create a function to get the status of a document processing job
  const getProcessingStatus = async (documentId: string) => {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return {
    processDocument: processDocumentMutation.mutate,
    processDocumentAsync: processDocumentMutation.mutateAsync,
    isProcessing: processDocumentMutation.isPending,
    error: processDocumentMutation.error,
    getProcessingStatus
  };
}
