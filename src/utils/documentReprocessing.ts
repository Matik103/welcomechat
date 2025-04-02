
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult } from '@/types/document-processing';
import { toast } from 'sonner';
import { callRpcFunctionSafe } from './rpcUtils';
import { v4 as uuidv4 } from 'uuid';

// Function to reprocess a document
export const reprocessDocument = async (
  documentId: string,
  clientId: string
): Promise<boolean> => {
  try {
    // Get document details
    const { data: document, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) {
      console.error('Error fetching document for reprocessing:', error);
      toast.error('Failed to fetch document details');
      return false;
    }
    
    // Create a new processing job
    const { data: newJob, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        document_url: document.document_url,
        document_type: document.document_type,
        status: 'pending',
        agent_name: document.agent_name || 'AI Assistant',
        document_id: uuidv4()
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Error creating reprocessing job:', jobError);
      toast.error('Failed to create reprocessing job');
      return false;
    }
    
    toast.success('Document queued for reprocessing');
    return true;
  } catch (error) {
    console.error('Error reprocessing document:', error);
    toast.error('An error occurred while reprocessing the document');
    return false;
  }
};

// Process all existing documents for a client
export const processExistingDocuments = async (
  clientId: string,
  agentName: string = 'AI Assistant'
): Promise<DocumentProcessingResult> => {
  try {
    // Find unprocessed documents
    const { data: documents, error } = await supabase
      .from('document_links')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) {
      console.error('Error fetching documents:', error);
      return { success: false, error: error.message, processed: 0, failed: 0 };
    }
    
    if (!documents || documents.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }
    
    let processed = 0;
    let failed = 0;
    
    // Process each document
    for (const doc of documents) {
      try {
        // Create a processing job
        const { error: jobError } = await supabase
          .from('document_processing_jobs')
          .insert({
            client_id: clientId,
            document_url: doc.link,
            document_type: doc.document_type || 'unknown',
            status: 'pending',
            agent_name: agentName,
            document_id: uuidv4()
          });
        
        if (jobError) {
          console.error('Error creating job for document:', doc.id, jobError);
          failed++;
        } else {
          processed++;
        }
      } catch (docError) {
        console.error('Error processing document:', doc.id, docError);
        failed++;
      }
    }
    
    return { 
      success: true, 
      processed, 
      failed 
    };
  } catch (error) {
    console.error('Error processing documents:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      processed: 0, 
      failed: 0 
    };
  }
};

// Simplify document type checking to avoid deep type instantiation
type DocumentMetadata = Record<string, any>;

// Define the type for RPC function response
interface RpcFunctionResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

// Extract document using Llama API
export const extractDocumentUsingLlama = async (
  documentId: string,
  clientId: string
): Promise<boolean> => {
  try {
    // Get document processing job details
    const { data: document, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error || !document) {
      console.error('Error fetching document for extraction:', error);
      return false;
    }
    
    // Update status to processing
    await supabase
      .from('document_processing_jobs')
      .update({ status: 'processing' })
      .eq('id', documentId);
    
    // Call RPC function to extract document
    const result = await callRpcFunctionSafe('extract_document_content', {
      document_url: document.document_url,
      document_type: document.document_type || 'pdf',
      client_id: clientId,
      job_id: documentId
    });
    
    // Type cast the result to our defined interface
    const typedResult = result as RpcFunctionResponse;
    
    if (!typedResult.success) {
      console.error('Error extracting document content:', typedResult.error);
      
      // Update status to failed
      await supabase
        .from('document_processing_jobs')
        .update({ 
          status: 'failed',
          error_message: typedResult.error || 'Unknown error during extraction'
        })
        .eq('id', documentId);
      
      return false;
    }
    
    // Update status to completed
    await supabase
      .from('document_processing_jobs')
      .update({ 
        status: 'completed',
        metadata: {
          processed_at: new Date().toISOString(),
          method: 'llama_extract'
        }
      })
      .eq('id', documentId);
    
    return true;
  } catch (error) {
    console.error('Error in extraction process:', error);
    
    // Try to update status to failed
    try {
      await supabase
        .from('document_processing_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', documentId);
    } catch (updateError) {
      console.error('Error updating job status:', updateError);
    }
    
    return false;
  }
};

export default reprocessDocument;
