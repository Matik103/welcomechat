
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

export default reprocessDocument;
