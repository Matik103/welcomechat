
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingService } from '@/services/documentProcessingService';
import { toast } from 'sonner';
import { callRpcFunctionSafe } from './rpcUtils';

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
        status: 'pending'
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

export default reprocessDocument;
