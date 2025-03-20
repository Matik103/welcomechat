
// Import the necessary types and utilities
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { createClientActivity } from './clientActivityService';
import { Json } from '@/integrations/supabase/types';

/**
 * Process a document with LlamaParse
 * @param documentId The document ID to process
 * @param options Processing options
 * @returns The processing result
 */
export const processDocumentWithLlamaParse = async (
  documentId: string,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    console.log(`Processing document ${documentId} with LlamaParse`);
    
    // Log the activity
    if (options.clientId) {
      await createClientActivity(
        options.clientId,
        'document_processing_started',
        'Started processing document with LlamaParse',
        {
          document_id: documentId,
          processor: 'llamaparse',
          agent_name: options.agentName || 'Default Agent'
        } as Json
      );
    }
    
    // Simulate processing for now - in a real implementation this would call the LlamaParse API
    // This is a placeholder that would be replaced with actual implementation
    const result: DocumentProcessingResult = {
      success: true,
      status: 'completed',
      documentId,
      metadata: {
        processor: 'llamaparse',
        processingTime: '2.5s',
        documentSize: '1.2MB'
      } as Json,
      content: 'Document processed successfully'
    };
    
    // Log the completion
    if (options.clientId) {
      await createClientActivity(
        options.clientId,
        'document_processing_completed',
        'Completed processing document with LlamaParse',
        {
          document_id: documentId,
          processor: 'llamaparse',
          success: true,
          agent_name: options.agentName || 'Default Agent'
        } as Json
      );
    }
    
    return result;
  } catch (error) {
    console.error('Error processing document with LlamaParse:', error);
    
    // Log the failure
    if (options.clientId) {
      await createClientActivity(
        options.clientId,
        'document_processing_failed',
        'Failed to process document with LlamaParse',
        {
          document_id: documentId,
          processor: 'llamaparse',
          error_message: error instanceof Error ? error.message : String(error),
          agent_name: options.agentName || 'Default Agent'
        } as Json
      );
    }
    
    return {
      success: false,
      status: 'failed',
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
