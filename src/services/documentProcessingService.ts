import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult, ParseResponse } from '@/types/document-processing';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { execSql } from '@/utils/rpcUtils';
import { LlamaCloudService } from '@/utils/LlamaCloudService';
import { uploadToOpenAIAssistant } from './openaiAssistantService';

/**
 * Store content in ai_agents table
 */
const storeInAiAgents = async (
  clientId: string,
  agentName: string,
  content: string,
  documentType: string,
  documentPath: string,
  metadata: Record<string, any>
) => {
  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      client_id: clientId,
      name: agentName,
      content: content,
      url: documentPath,
      interaction_type: "document",
      settings: {
        title: metadata.title || "Untitled Document",
        document_type: documentType,
        source_url: documentPath,
        processing_method: metadata.processing_method,
        processed_at: new Date().toISOString(),
        ...metadata
      },
      status: "active",
      type: documentType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

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
 * Chunks document content into manageable pieces
 */
const CHUNK_SIZE = 8000;
const CHUNK_OVERLAP = 200;

export const chunkDocument = (content: string): Array<{
  content: string;
  metadata: {
    chunk_index: number;
    total_chunks: number;
    start_position: number;
    end_position: number;
  }
}> => {
  const chunks: Array<{
    content: string;
    metadata: {
      chunk_index: number;
      total_chunks: number;
      start_position: number;
      end_position: number;
    }
  }> = [];
  
  let position = 0;
  let chunkIndex = 0;
  
  while (position < content.length) {
    const end = Math.min(position + CHUNK_SIZE, content.length);
    const chunk = content.slice(position, end);
    
    chunks.push({
      content: chunk,
      metadata: {
        chunk_index: chunkIndex,
        total_chunks: Math.ceil(content.length / CHUNK_SIZE),
        start_position: position,
        end_position: end
      }
    });
    
    position = end - CHUNK_OVERLAP;
    chunkIndex++;
  }
  
  return chunks;
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
      processingMethod = 'llamaparse'
    } = options;
    
    // First, log that processing has started
    await execSql(`
      SELECT log_client_activity(
        '${clientId}',
        'document_processing_started',
        'Document processing started for: ${documentPath}',
        '{"path": "${documentPath}", "method": "${processingMethod}"}'::jsonb
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
    
    // Parse document with LlamaParse
    const parseResult = await LlamaCloudService.parseDocument(
      publicUrl,
      documentType,
      clientId,
      agentName
    );
    
    if (!parseResult.success) {
      throw new Error(parseResult.error || 'Failed to parse document');
    }
    
    // Chunk the content if it's large
    const chunks = chunkDocument(parseResult.content);
    
    // Store chunks in ai_agents table
    for (const chunk of chunks) {
      await storeInAiAgents(
        clientId,
        agentName,
        chunk.content,
        documentType,
        documentPath,
        {
          ...parseResult.metadata,
          chunk_metadata: chunk.metadata
        }
      );
    }
    
    // Upload to OpenAI Assistant
    const openaiResult = await uploadToOpenAIAssistant(
      clientId,
      agentName,
      parseResult.content,
      parseResult.metadata.title || 'Untitled Document'
    );
    
    if (!openaiResult.success) {
      throw new Error(`Failed to upload to OpenAI Assistant: ${openaiResult.error}`);
    }
    
    return {
      success: true,
      status: 'completed',
      documentId: parseResult.documentId,
      chunks: chunks.length,
      metadata: {
        path: documentPath,
        processedAt: new Date().toISOString(),
        method: processingMethod,
        publicUrl: publicUrl,
        openaiAssistantId: openaiResult.assistantId
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
