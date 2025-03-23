
/**
 * Document Processing Service
 * Version: 1.0.1
 * Force deployment: true
 */

import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult, ParseResponse, DocumentProcessingStatus, DocumentChunk, DocumentMetadata } from '@/types/document-processing';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { execSql } from '@/utils/rpcUtils';
import { LlamaCloudService, LlamaParseError } from '@/utils/LlamaCloudService';
import { uploadToOpenAIAssistant } from './openaiAssistantService';
import { validateContent, chunkContent } from '@/utils/documentProcessing';

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

// Type guard for DocumentChunk
function isDocumentChunk(chunk: unknown): chunk is DocumentChunk {
  if (!chunk || typeof chunk !== 'object') return false;
  const c = chunk as any;
  return (
    typeof c.id === 'string' &&
    typeof c.content === 'string' &&
    typeof c.length === 'number' &&
    c.metadata !== undefined
  );
}

// Type guard for DocumentMetadata
function isDocumentMetadata(metadata: unknown): metadata is DocumentMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as any;
  return (
    typeof m.path === 'string' &&
    typeof m.processedAt === 'string' &&
    typeof m.method === 'string' &&
    typeof m.publicUrl === 'string' &&
    typeof m.totalChunks === 'number' &&
    typeof m.characterCount === 'number' &&
    typeof m.wordCount === 'number' &&
    typeof m.averageChunkSize === 'number'
  );
}

// Convert database record to DocumentProcessingResult
function convertToDocumentProcessingResult(record: any): DocumentProcessingResult {
  // Convert chunks
  const chunks: DocumentChunk[] = Array.isArray(record.chunks)
    ? record.chunks.filter(isDocumentChunk)
    : [];

  // Convert metadata
  let metadata: DocumentMetadata;
  if (isDocumentMetadata(record.metadata)) {
    metadata = record.metadata;
  } else {
    // Provide default metadata if the record's metadata is invalid
    metadata = {
      path: record.document_url,
      processedAt: record.created_at,
      method: 'llamaparse',
      publicUrl: record.document_url,
      totalChunks: chunks.length,
      characterCount: 0,
      wordCount: 0,
      averageChunkSize: 0,
      ...(typeof record.metadata === 'object' ? record.metadata : {})
    };
  }

  return {
    status: record.status as DocumentProcessingStatus,
    documentUrl: record.document_url,
    documentType: record.document_type,
    clientId: record.client_id,
    agentName: record.agent_name,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    error: record.error,
    chunks,
    metadata
  };
}

export class DocumentProcessingService {
  /**
   * Process a document using LlamaParse and store the results
   */
  static async processDocument(
    documentUrl: string,
    documentType: string,
    clientId: string,
    agentName: string
  ): Promise<DocumentProcessingResult> {
    try {
      // Create initial processing record
      const processingRecord: DocumentProcessingResult = {
        status: 'processing',
        documentUrl,
        documentType,
        clientId,
        agentName,
        startedAt: new Date().toISOString(),
        chunks: [],
        metadata: {
          path: documentUrl,
          processedAt: new Date().toISOString(),
          method: 'llamaparse',
          publicUrl: documentUrl,
          totalChunks: 0,
          characterCount: 0,
          wordCount: 0,
          averageChunkSize: 0
        }
      };

      // Store initial processing status
      await this.updateProcessingStatus(processingRecord);

      // Parse document using LlamaParse
      const parseResult = await LlamaCloudService.parseDocument(
        documentUrl,
        documentType,
        clientId,
        agentName
      );

      if (!parseResult.success || !parseResult.content) {
        return await this.handleProcessingError(
          processingRecord,
          parseResult.error || 'Unknown error',
          parseResult.errorDetails
        );
      }

      // Validate content
      const validationResult = validateContent(parseResult.content);
      if (!validationResult.isValid) {
        return await this.handleProcessingError(
          processingRecord,
          `Content validation failed: ${validationResult.error || 'Unknown error'}`,
          { code: 'VALIDATION_ERROR', details: validationResult }
        );
      }

      // Process content into chunks
      const chunks = await chunkContent(parseResult.content);
      
      // Update processing record with results
      processingRecord.status = 'completed';
      processingRecord.chunks = chunks;
      processingRecord.completedAt = new Date().toISOString();
      processingRecord.metadata = {
        ...processingRecord.metadata,
        ...parseResult.metadata,
        totalChunks: chunks.length,
        characterCount: parseResult.content.length,
        wordCount: parseResult.content.split(/\s+/).length,
        averageChunkSize: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
      };

      // Store final results
      await this.updateProcessingStatus(processingRecord);
      return processingRecord;
    } catch (error) {
      const processingRecord: DocumentProcessingResult = {
        status: 'failed',
        documentUrl,
        documentType,
        clientId,
        agentName,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        chunks: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          path: documentUrl,
          processedAt: new Date().toISOString(),
          method: 'llamaparse',
          publicUrl: documentUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: error instanceof LlamaParseError ? error.code : 'UNKNOWN_ERROR',
          totalChunks: 0,
          characterCount: 0,
          wordCount: 0,
          averageChunkSize: 0
        }
      };

      await this.updateProcessingStatus(processingRecord);
      return processingRecord;
    }
  }

  /**
   * Handle processing errors and update status
   */
  private static async handleProcessingError(
    processingRecord: DocumentProcessingResult,
    error: string,
    errorDetails?: any
  ): Promise<DocumentProcessingResult> {
    processingRecord.status = 'failed';
    processingRecord.error = error;
    processingRecord.completedAt = new Date().toISOString();
    processingRecord.metadata = {
      ...processingRecord.metadata,
      error,
      errorCode: errorDetails?.code || 'UNKNOWN_ERROR',
      errorDetails: errorDetails
    };

    await this.updateProcessingStatus(processingRecord);
    return processingRecord;
  }

  /**
   * Update processing status in the database
   */
  private static async updateProcessingStatus(
    processingRecord: DocumentProcessingResult
  ): Promise<void> {
    try {
      // Convert metadata to a plain object for storage
      const metadata: { [key: string]: any } = {
        path: processingRecord.metadata.path,
        processedAt: processingRecord.metadata.processedAt,
        method: processingRecord.metadata.method,
        publicUrl: processingRecord.metadata.publicUrl,
        totalChunks: processingRecord.metadata.totalChunks,
        characterCount: processingRecord.metadata.characterCount,
        wordCount: processingRecord.metadata.wordCount,
        averageChunkSize: processingRecord.metadata.averageChunkSize,
        title: processingRecord.metadata.title,
        author: processingRecord.metadata.author,
        createdAt: processingRecord.metadata.createdAt,
        pageCount: processingRecord.metadata.pageCount,
        language: processingRecord.metadata.language,
        error: processingRecord.metadata.error,
        errorCode: processingRecord.metadata.errorCode,
        errorDetails: processingRecord.metadata.errorDetails
      };

      // Convert chunks to a plain array for storage
      const chunks = processingRecord.chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        length: chunk.length,
        metadata: chunk.metadata
      }));

      // For now, skip database update to avoid errors with missing table
      // We'll implement proper table structure in a later migration
      console.log("Document processing status updated:", {
        document_url: processingRecord.documentUrl,
        client_id: processingRecord.clientId,
        agent_name: processingRecord.agentName,
        document_type: processingRecord.documentType,
        status: processingRecord.status,
        metadata,
        chunks: chunks.length
      });
    } catch (error) {
      console.error('Error in updateProcessingStatus:', error);
      // Don't throw here to prevent cascading failures
    }
  }

  /**
   * Get the processing status for a document
   */
  static async getProcessingStatus(
    documentUrl: string,
    clientId: string
  ): Promise<DocumentProcessingResult | null> {
    try {
      // For now, return a mock result until database table is properly created
      console.log("Checking processing status for document:", documentUrl);
      return null;
    } catch (error) {
      console.error('Error in getProcessingStatus:', error);
      return null;
    }
  }

  /**
   * List all processed documents for a client
   */
  static async listProcessedDocuments(
    clientId: string,
    status?: DocumentProcessingStatus
  ): Promise<DocumentProcessingResult[]> {
    try {
      // For now, return an empty array until database table is properly created
      console.log("Listing processed documents for client:", clientId, status);
      return [];
    } catch (error) {
      console.error('Error in listProcessedDocuments:', error);
      return [];
    }
  }
}

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
