
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult, DocumentType } from '@/types/document-processing';
import { createClientActivity } from './clientActivityService';

/**
 * Process a document URL for a client
 */
export async function processDocumentUrl(
  clientId: string,
  documentUrl: string,
  documentType: DocumentType | string,
  agentName: string
): Promise<DocumentProcessingResult> {
  try {
    // Create a new document processing job
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        agent_name: agentName,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Log the activity
    const { data: activityData } = await createClientActivity(
      clientId,
      'document_processed',
      `Started processing ${documentType}: ${documentUrl}`,
      { document_type: documentType, document_url: documentUrl }
    );

    return {
      success: true,
      processed: 0,
      failed: 0,
      jobId: job.id
    };
  } catch (error) {
    console.error('Error processing document URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: 0,
      failed: 0
    };
  }
}

/**
 * Check the processing status of a document
 */
export async function checkDocumentProcessingStatus(
  jobId: string
): Promise<DocumentProcessingResult> {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        success: false,
        error: 'Job not found',
        processed: 0,
        failed: 0
      };
    }

    const metadata = data.metadata || {};
    const processed = metadata.processed_count || 0;
    const failed = metadata.failed_count || 0;

    return {
      success: data.status === 'completed',
      error: data.error || null,
      processed: processed,
      failed: failed,
      jobId: data.id
    };
  } catch (error) {
    console.error('Error checking document processing status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: 0,
      failed: 0
    };
  }
}

/**
 * Upload a document for processing
 */
export async function uploadDocument(
  clientId: string,
  file: File,
  agentName: string
): Promise<DocumentProcessingResult> {
  try {
    // Create a unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = `documents/${clientId}/${fileName}`;

    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded document');
    }

    // Create a document processing job
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: clientId,
        document_url: urlData.publicUrl,
        document_type: 'document',
        agent_name: agentName,
        status: 'pending',
        metadata: {
          original_filename: file.name,
          file_size: file.size,
          content_type: file.type
        }
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Log the activity
    await createClientActivity(
      clientId,
      'document_added',
      `Uploaded document: ${file.name}`,
      { 
        filename: file.name, 
        file_size: file.size,
        document_type: 'document'
      }
    );

    return {
      success: true,
      processed: 0,
      failed: 0,
      jobId: job.id
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: 0,
      failed: 0
    };
  }
}

/**
 * Get documents for a client
 */
export async function getDocumentsForClient(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting documents for client:', error);
    throw error;
  }
}
