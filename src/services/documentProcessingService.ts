
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';
import { createClientActivity } from '@/services/clientActivityService';
import { v4 as uuidv4 } from 'uuid';

// Register a document for processing
export const registerDocumentForProcessing = async (
  clientId: string,
  documentUrl: string,
  documentType: string
): Promise<string> => {
  try {
    // First check if we have a document processing table
    // If not, we'll skip the registration
    const checkTable = await callRpcFunctionSafe<any>(
      'check_table_exists',
      { table_name: 'document_processing' }
    );
    
    if (!checkTable || !checkTable.exists) {
      console.log('Document processing table does not exist');
      
      // Log this for debugging
      await createClientActivity(
        clientId,
        'error_logged',
        'Document processing attempted but table does not exist',
        { url: documentUrl }
      );
      
      // Generate a placeholder ID for the document
      return `manual-${uuidv4()}`;
    }
    
    // Generate a unique documentId
    const documentId = uuidv4();
    
    // Get the agent name for this client
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (agentError) {
      console.error('Error getting agent name:', agentError);
      throw agentError;
    }
    
    const agentName = agentData?.name || 'AI Assistant';
    
    // Insert a record in the document_processing table
    const { data, error } = await supabase
      .from('document_processing')
      .insert({
        document_id: documentId,
        document_url: documentUrl,
        document_type: documentType,
        client_id: clientId,
        agent_name: agentName,
        status: 'pending'
      });
    
    if (error) {
      console.error('Error registering document for processing:', error);
      throw error;
    }
    
    // Log the activity
    await createClientActivity(
      clientId,
      'document_processing_started',
      `Document processing started: ${documentUrl}`,
      { document_id: documentId, document_type: documentType }
    );
    
    return documentId;
  } catch (error) {
    console.error('Error in registerDocumentForProcessing:', error);
    throw error;
  }
};

// Check document processing status
export const checkDocumentProcessingStatus = async (
  documentId: string
): Promise<'pending' | 'processing' | 'completed' | 'failed'> => {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .select('status')
      .eq('document_id', documentId)
      .single();
    
    if (error) {
      console.error('Error checking document processing status:', error);
      return 'failed';
    }
    
    return data.status as 'pending' | 'processing' | 'completed' | 'failed';
  } catch (error) {
    console.error('Error in checkDocumentProcessingStatus:', error);
    return 'failed';
  }
};
