
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult } from '@/types/document-processing';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

/**
 * Register a document for processing
 */
export async function registerDocumentProcessing(request: {
  client_id: string;
  document_url: string;
  document_type: string;
}): Promise<string> {
  try {
    const result = await callRpcFunctionSafe('log_client_activity', {
      client_id_param: request.client_id,
      activity_type_param: 'document_added',
      description_param: `Document added for processing: ${request.document_url}`,
      metadata_param: {
        document_url: request.document_url,
        document_type: request.document_type
      }
    });

    if (!result) {
      throw new Error('Failed to register document for processing');
    }

    // Cast the result to an object with the expected properties
    const typedResult = result as { success?: boolean; error?: string; activity_id?: string };

    if (!typedResult.success) {
      throw new Error(typedResult.error || 'Failed to register document for processing');
    }

    // Return a job ID (in this case, we're just returning the activity ID)
    return typedResult.activity_id || '';
  } catch (error) {
    console.error('Error registering document for processing:', error);
    throw error;
  }
}

/**
 * Get the status of a document processing job
 */
export async function getDocumentProcessingStatus(jobId: string): Promise<DocumentProcessingResult> {
  try {
    // Check document processing status
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to get document processing status: ${error.message}`,
        processed: 0,
        failed: 0
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Document processing job not found',
        processed: 0,
        failed: 0
      };
    }

    // Extract the processed_count and failed_count with defaults
    const processedCount = typeof data.processed_count === 'number' ? data.processed_count : 0;
    const failedCount = typeof data.failed_count === 'number' ? data.failed_count : 0;

    return {
      success: data.status === 'completed',
      error: data.error_message || null,
      processed: processedCount,
      failed: failedCount,
      jobId: String(data.id)
    };
  } catch (error) {
    console.error('Error getting document processing status:', error);
    return {
      success: false,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processed: 0,
      failed: 0
    };
  }
}

/**
 * Get documents for a client
 */
export async function getDocumentsByClientId(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: number) {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Process a document
 */
export async function processDocument(documentId: string) {
  try {
    // Call the Supabase function to process the document
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { document_id: documentId }
    });

    if (error) {
      throw new Error(`Failed to process document: ${error.message}`);
    }

    return {
      success: true,
      jobId: data?.job_id,
      processed: 0,
      failed: 0
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      error: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processed: 0,
      failed: 0
    };
  }
}

/**
 * Reprocess a document
 */
export async function reprocessDocument(documentId: number) {
  return processDocument(documentId.toString());
}
