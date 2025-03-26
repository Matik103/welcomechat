
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult } from '@/types/document-processing';

// Register a document for processing
export async function registerDocumentForProcessing(
  clientId: string,
  documentUrl: string,
  documentType: string
): Promise<string> {
  try {
    // Call a custom function to register the document
    const { data, error } = await supabase.rpc('register_document_processing', {
      p_client_id: clientId,
      p_document_url: documentUrl,
      p_document_type: documentType
    });
    
    if (error) throw error;
    return data || 'unknown';
  } catch (error) {
    console.error('Error registering document for processing:', error);
    throw error;
  }
}

// Check the status of a document processing job
export async function checkDocumentProcessingStatus(documentId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .select('status')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    return data.status as 'pending' | 'processing' | 'completed' | 'failed';
  } catch (error) {
    console.error('Error checking document processing status:', error);
    return 'failed';
  }
}

// Upload a document
export async function uploadDocument(file: File, clientId: string): Promise<string> {
  // Generate a unique file path
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const filePath = `documents/${clientId}/${timestamp}-${file.name}`;
  
  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('client-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('client-documents')
    .getPublicUrl(filePath);
  
  const fileUrl = publicUrlData.publicUrl;
  
  // Insert record in document_processing table
  const { data: processingData, error: processingError } = await supabase
    .from('document_processing')
    .insert({
      client_id: clientId,
      document_url: fileUrl,
      document_type: fileExt || 'unknown',
      status: 'pending',
      started_at: new Date().toISOString(),
      agent_name: 'AI Assistant',
      metadata: {
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type
      }
    })
    .select('id')
    .single();
  
  if (processingError) throw processingError;
  
  return processingData.id.toString();
}

// Process a document
export async function processDocument(
  documentUrl: string,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> {
  try {
    // Call edge function to process document
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        documentUrl,
        clientId: options.clientId,
        documentType: options.documentType || 'unknown',
        agentName: options.agentName || 'AI Assistant'
      }
    });
    
    if (error) throw error;
    
    return {
      success: true,
      documentId: data.documentId,
      processed: data.processed || 0,
      failed: data.failed || 0
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processed: 0,
      failed: 1
    };
  }
}

// Export the services
export const DocumentProcessingService = {
  register: registerDocumentForProcessing,
  checkStatus: checkDocumentProcessingStatus,
  uploadDocument,
  processDocument
};
