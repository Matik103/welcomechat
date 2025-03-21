import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult } from '@/types/document-processing';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { execSql } from '@/utils/rpcUtils';
import { LlamaCloudService } from '@/utils/LlamaCloudService';

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
    const { 
      clientId, 
      agentName = 'AI Assistant', 
      processingMethod = 'llamaparse',
      integrateWithOpenAI = true 
    } = options;
    
    // First, log that processing has started
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_processing_started',
        'Document processing started for: ${documentPath}',
        '{"path": "${documentPath}", "method": "${processingMethod}", "openai_integration": ${integrateWithOpenAI}}'::jsonb
      )
    `);
    
    // Get public URL for the document
    const { data: publicUrlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(documentPath);
    
    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL for document');
    }
    
    const publicUrl = publicUrlData.publicUrl;
    
    // Determine document type from file extension
    const fileExtension = documentPath.split('.').pop()?.toLowerCase();
    let documentType = 'other';
    
    if (['pdf'].includes(fileExtension || '')) {
      documentType = 'pdf';
    } else if (['doc', 'docx'].includes(fileExtension || '')) {
      documentType = 'google_doc';
    } else if (['xls', 'xlsx'].includes(fileExtension || '')) {
      documentType = 'google_sheet';
    } else if (['ppt', 'pptx'].includes(fileExtension || '')) {
      documentType = 'powerpoint';
    } else if (['txt', 'md'].includes(fileExtension || '')) {
      documentType = 'text';
    }
    
    // Use LlamaCloudService to parse the document
    const result = await LlamaCloudService.parseDocument(
      publicUrl,
      documentType,
      clientId,
      agentName || 'AI Assistant'
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error processing document');
    }
    
    // The actual processing happens asynchronously on the server side
    // For now, we just return a success response
    const documentId = `doc-${Date.now()}`;
    
    // Log successful processing request
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_processing_requested',
        'Document processing requested for: ${documentPath}',
        '{"document_id": "${documentId}", "path": "${documentPath}"}'::jsonb
      )
    `);

    // If OpenAI integration is enabled, schedule the document to be added to the OpenAI Assistant
    if (integrateWithOpenAI) {
      await execSql(`
        SELECT log_client_activity(
          '${clientId}',
          'openai_assistant_integration_requested',
          'Document scheduled for OpenAI Assistant integration: ${documentPath}',
          '{"document_id": "${documentId}", "path": "${documentPath}"}'::jsonb
        )
      `);
      
      // This will be handled by the Edge Function after document processing
    }
    
    return {
      success: true,
      status: 'processing',
      documentId,
      content: `Processing initiated for document at ${documentPath}`,
      metadata: {
        path: documentPath,
        processedAt: new Date().toISOString(),
        method: processingMethod,
        publicUrl: publicUrl,
        openaiIntegration: integrateWithOpenAI
      }
    };
  } catch (error: any) {
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
