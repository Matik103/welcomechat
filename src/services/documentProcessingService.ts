
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult } from '@/types/document-processing';
import { createClientActivity } from '@/services/clientActivityService';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { execSql } from '@/utils/rpcUtils';

/**
 * Upload a document to the storage bucket
 */
export const uploadDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<string> => {
  try {
    const { clientId, onUploadProgress } = options;
    
    // Create a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${timestamp}-${file.name}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
    
    if (error) {
      throw error;
    }
    
    // Log document upload activity
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_uploaded',
        'Document uploaded: ${file.name}',
        '{"file_name": "${file.name}", "size": ${file.size}, "type": "${file.type}"}'::jsonb
      )
    `);
    
    if (onUploadProgress) {
      onUploadProgress(100);
    }
    
    return data.path;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Process a document that has been uploaded
 */
export const processDocument = async (
  documentPath: string,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    const { clientId, processingMethod = 'standard' } = options;
    
    // First, log that processing has started
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_processing_started',
        'Document processing started for: ${documentPath}',
        '{"path": "${documentPath}", "method": "${processingMethod}"}'::jsonb
      )
    `);
    
    // For now we'll mock the processing
    // In a real implementation, this would call your document processing service
    
    // Mock processing delay (would be replaced with actual processing)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a document ID
    const documentId = `doc-${Date.now()}`;
    
    // Log successful processing
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_processing_completed',
        'Document processing completed for: ${documentPath}',
        '{"document_id": "${documentId}", "path": "${documentPath}"}'::jsonb
      )
    `);
    
    return {
      success: true,
      status: 'completed',
      documentId,
      content: `Processed content for document at ${documentPath}`,
      metadata: {
        path: documentPath,
        processedAt: new Date().toISOString(),
        method: processingMethod
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Log processing failure
    await execSql(`
      SELECT log_client_activity(
        '${options.clientId}',
        'document_processing_failed',
        'Document processing failed: ${error.message || "Unknown error"}',
        '{"path": "${documentPath}"}'::jsonb
      )
    `);
    
    return {
      success: false,
      status: 'failed',
      documentId: `error-${Date.now()}`,
      error: error instanceof Error ? error.message : 'Unknown error processing document'
    };
  }
};

/**
 * Check the access status of a document link
 */
export const checkDocumentAccess = async (documentId: number): Promise<string> => {
  try {
    const result = await callRpcFunction<string>('get_document_access_status', {
      document_id: documentId
    });
    return result || 'unknown';
  } catch (error) {
    console.error('Error checking document access:', error);
    return 'unknown';
  }
};
