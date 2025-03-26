
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingRequest, DocumentProcessingResult } from '@/types/document-processing';

/**
 * Register a document for processing
 */
export async function registerDocumentProcessing(request: DocumentProcessingRequest): Promise<string> {
  try {
    // Use the RPC function to register the document
    const { data, error } = await supabase.rpc(
      'register_document_processing',
      {
        client_id_param: request.client_id,
        document_url_param: request.document_url,
        document_type_param: request.document_type
      }
    );

    if (error) {
      console.error('Error registering document for processing:', error);
      throw new Error(error.message);
    }

    return data || '';
  } catch (error) {
    console.error('Error in registerDocumentProcessing:', error);
    throw error;
  }
}

/**
 * Get the status of a document processing job
 */
export async function getDocumentProcessingStatus(jobId: number): Promise<DocumentProcessingResult> {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error getting document processing status:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      jobId: data.id,
      status: data.status,
      documentUrl: data.document_url,
      error: data.error
    };
  } catch (error) {
    console.error('Error in getDocumentProcessingStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Add a document processing job record
 */
export async function addDocumentProcessingJob(
  clientId: string,
  documentUrl: string,
  documentType: string
) {
  try {
    // Generate a unique document_id
    const documentId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        status: 'pending',
        agent_name: 'document_processor', // Default agent name for processing
        document_id: documentId,
        started_at: new Date().toISOString() 
      });

    if (error) {
      console.error('Error adding document processing job:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addDocumentProcessingJob:', error);
    throw error;
  }
}

/**
 * Process a document
 */
export async function processDocument(
  clientId: string,
  documentUrl: string,
  documentType: string
): Promise<DocumentProcessingResult> {
  try {
    // First, register the document for processing
    const jobId = await registerDocumentProcessing({
      client_id: clientId,
      document_url: documentUrl,
      document_type: documentType
    });

    // Return initial success status
    return {
      success: true,
      jobId: Number(jobId),
      status: 'pending',
      documentUrl
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload a document for processing
 */
export async function uploadDocument(file: File, clientId: string) {
  try {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const filePath = `documents/${clientId}/${fileName}`;

    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading document:', uploadError);
      throw uploadError;
    }

    // Get the public URL for the file
    const { data: urlData } = await supabase.storage
      .from('client-documents')
      .getPublicUrl(filePath);

    const documentUrl = urlData.publicUrl;

    // Create a processing job for the document
    const processingResult = await processDocument(
      clientId,
      documentUrl,
      file.type
    );

    return {
      success: true,
      filePath,
      publicUrl: documentUrl,
      processingJobId: processingResult.jobId
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
