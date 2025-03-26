
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult, DocumentProcessingStatus, DocumentType } from '@/types/document-processing';
import { v4 as uuidv4 } from 'uuid';
import { ActivityType } from '@/types/client-form';
import { createClientActivity } from './clientActivityService';

// Process a document URL
export const processDocumentUrl = async (
  clientId: string,
  documentUrl: string,
  documentType: DocumentType | string,
  agentName: string
): Promise<DocumentProcessingResult> => {
  try {
    // Generate a unique document ID
    const documentId = uuidv4();
    
    // Create a record in the document_processing table
    const { data, error } = await supabase
      .from('document_processing')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        agent_name: agentName,
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: {
          document_id: documentId
        }
      })
      .select();

    if (error) throw error;

    // Log the activity
    await createClientActivity(
      clientId,
      'document_added' as ActivityType,
      `Document processing started for: ${documentUrl}`,
      { document_url: documentUrl, document_type: documentType }
    );

    return {
      success: true,
      processed: 0,
      failed: 0,
      jobId: documentId,
      status: 'pending',
      documentUrl: documentUrl,
      message: 'Document processing started'
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
};

// Check the status of a document processing job
export const checkDocumentProcessingStatus = async (
  jobId: string
): Promise<DocumentProcessingResult> => {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;

    const status = data.status;
    // Safely access metadata properties
    const metadata = data.metadata as Record<string, any> || {};
    const processed_count = metadata.processed_count || 0;
    const failed_count = metadata.failed_count || 0;
    const error_message = data.error;

    return {
      success: status === 'completed',
      status: status,
      processed: processed_count,
      failed: failed_count,
      error: error_message,
      jobId: jobId
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
};

// Upload a document
export const uploadDocument = async (
  clientId: string,
  file: File,
  agentName: string
): Promise<DocumentProcessingResult> => {
  try {
    // Generate a unique document ID and file path
    const documentId = uuidv4();
    const filePath = `documents/${clientId}/${documentId}/${file.name}`;
    
    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const documentUrl = urlData.publicUrl;

    // Create a record in the document_processing table
    const { data, error } = await supabase
      .from('document_processing')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: detectDocumentType(file.name),
        agent_name: agentName,
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: {
          document_id: documentId,
          original_filename: file.name,
          file_size: file.size,
          content_type: file.type
        }
      })
      .select();

    if (error) throw error;

    // Log the activity
    await createClientActivity(
      clientId,
      'document_added' as ActivityType,
      `Document uploaded: ${file.name}`,
      { document_name: file.name, document_type: file.type }
    );

    return {
      success: true,
      processed: 0,
      failed: 0,
      jobId: documentId,
      status: 'pending',
      documentUrl: documentUrl,
      message: 'Document upload successful'
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
};

// Get all documents for a client
export const getDocumentsForClient = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

// Detect document type based on filename
function detectDocumentType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'docx';
    case 'txt':
      return 'text';
    case 'html':
    case 'htm':
      return 'html';
    default:
      return 'document';
  }
}
