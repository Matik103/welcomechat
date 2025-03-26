
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
  status?: string;
}

export const processDocument = async (
  clientId: string, 
  documentUrl: string, 
  documentType: string,
  documentId: string = uuidv4()
): Promise<DocumentProcessingResult> => {
  try {
    // Create a document processing record
    const { error: recordError } = await supabase
      .from('document_processing')
      .insert({
        id: documentId,
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        status: 'pending',
        agent_name: 'AI Assistant', // Default agent name
        started_at: new Date().toISOString()
      });

    if (recordError) {
      console.error('Error creating document processing record:', recordError);
      return {
        success: false,
        error: recordError.message,
        status: 'failed'
      };
    }

    // Log the activity
    await supabase.from('client_activities').insert({
      client_id: clientId,
      activity_type: 'document_uploaded',
      description: `Document uploaded: ${documentType}`,
      metadata: {
        document_id: documentId,
        document_url: documentUrl,
        document_type: documentType
      }
    });

    return {
      success: true,
      documentId,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed'
    };
  }
};
