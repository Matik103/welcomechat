
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define result type here to avoid importing issues
interface DocumentProcessingResult {
  success: boolean;
  error?: string;
  documentId?: string;
  processed?: number;
  failed?: number;
  urlsScraped?: number;
  contentStored?: boolean;
}

// Define options type here to avoid importing issues
interface DocumentProcessingOptions {
  clientId: string;
  documentType?: string;
  agentName?: string;
}

export function useDocumentProcessor() {
  const processDocument = useMutation({
    mutationFn: async (options: {
      clientId: string;
      documentUrl: string;
      documentType: string;
    }): Promise<DocumentProcessingResult> => {
      const { clientId, documentUrl, documentType } = options;
      
      try {
        // Create a processing ID
        const processingId = uuidv4();
        
        // Create a document processing record
        const { data, error } = await supabase
          .from('document_processing')
          .insert([
            {
              client_id: clientId,
              document_url: documentUrl,
              document_type: documentType,
              agent_name: 'AI Assistant',
              status: 'pending',
              started_at: new Date().toISOString(),
              metadata: {
                source: 'manual_upload',
                processingId
              }
            }
          ])
          .select();
          
        if (error) {
          console.error('Error creating document processing record:', error);
          return {
            success: false,
            error: error.message
          };
        }

        // For now, we're just returning success
        // In a real implementation, you would trigger a background job
        return {
          success: true,
          documentId: processingId,
          processed: 1,
          failed: 0
        };
      } catch (error) {
        console.error('Error processing document:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string): Promise<boolean> => {
      try {
        // Delete from document_processing if exists
        await supabase
          .from('document_processing')
          .delete()
          .eq('id', documentId);
          
        return true;
      } catch (error) {
        console.error('Error deleting document:', error);
        return false;
      }
    }
  });

  return {
    processDocument,
    deleteDocument
  };
}
