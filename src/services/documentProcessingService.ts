/**
 * Document Processing Service
 * Version: 1.0.3
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
import { tableExists } from '@/utils/supabaseUtils';

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
  try {
    console.log(`Storing document content in ai_agents table for client ${clientId}, agent ${agentName}`);
    
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
          processing_method: metadata.processing_method || 'llamaparse',
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
      console.error("Error storing in ai_agents:", error);
      throw error;
    }

    console.log("Successfully stored document content in ai_agents with ID:", data.id);
    return data;
  } catch (error) {
    console.error("Error in storeInAiAgents:", error);
    throw error;
  }
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
    const bucketName = 'Document Storage';
    const bucketId = 'Document_Storage'; // URL-safe bucket ID for storage.from()
    
    // Verify bucket exists
    let { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
    
    if (bucketError) {
      console.error('Error accessing bucket:', bucketError);
      throw new Error(`Failed to access document storage bucket: ${bucketError.message}`);
    }
    
    // Create a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const fileName = `${clientId}/${timestamp}-${file.name}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucketId)
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

      // Parse document using LlamaParse
      try {
        const parseResult = await LlamaCloudService.parseDocument(
          documentUrl,
          documentType,
          clientId,
          agentName
        );

        processingRecord.content = parseResult.content;
        processingRecord.metadata = {
          ...processingRecord.metadata,
          ...parseResult.metadata,
          processedAt: new Date().toISOString()
        };
        processingRecord.status = 'completed';
        
        await this.updateProcessingStatus(processingRecord);
        return processingRecord;
      } catch (error) {
        return this.handleProcessingError(
          processingRecord,
          error instanceof Error ? error.message : 'Document processing failed'
        );
      }
    } catch (error) {
      console.error('Error in processDocument:', error);
      return this.handleProcessingError(
        {
          status: 'failed',
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
        },
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
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
    
    // Also store error in error_logs table for better visibility
    try {
      await supabase.from('error_logs').insert({
        client_id: processingRecord.clientId,
        error_type: 'document_processing',
        message: error,
        status: 'new'
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return processingRecord;
  }

  /**
   * Update processing status in the database
   */
  private static async updateProcessingStatus(
    processingRecord: DocumentProcessingResult
  ): Promise<void> {
    try {
      // Log the status update to ai_agents table
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          status: processingRecord.status === 'completed' ? 'active' : 'failed',
          updated_at: new Date().toISOString(),
          settings: {
            ...processingRecord.metadata,
            processing_status: processingRecord.status,
            error: processingRecord.error
          }
        })
        .eq('client_id', processingRecord.clientId)
        .eq('name', processingRecord.agentName)
        .eq('url', processingRecord.documentUrl);

      if (error) {
        console.error('Error updating processing status:', error);
        throw error;
      }

      // Log the status update
      await execSql(`
        SELECT log_client_activity(
          '${processingRecord.clientId}',
          'document_processing_${processingRecord.status}',
          'Document processing ${processingRecord.status}: ${processingRecord.documentUrl}',
          '${JSON.stringify({
            status: processingRecord.status,
            documentUrl: processingRecord.documentUrl,
            documentType: processingRecord.documentType,
            error: processingRecord.error
          })}'::jsonb
        )
      `);
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
      // Check if document_processing table exists
      const docProcExists = await tableExists('document_processing');
      
      if (docProcExists) {
        // Query the document_processing table using SQL to avoid type issues
        const sql = `
          SELECT * FROM document_processing
          WHERE document_url = '${documentUrl}'
          AND client_id = '${clientId}'
          LIMIT 1
        `;
        
        const result = await execSql(sql);
        
        if (result && Array.isArray(result) && result.length > 0) {
          return convertToDocumentProcessingResult(result[0]);
        }
      }
      
      // If table doesn't exist or no record found, check in ai_agents as fallback
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('url', documentUrl)
        .eq('client_id', clientId)
        .eq('interaction_type', 'document')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (agentsError) {
        console.error('Error fetching from ai_agents:', agentsError);
        return null;
      }
      
      if (agentsData && agentsData.length > 0) {
        const agent = agentsData[0];
        const settings = agent.settings || {};
        
        // Convert ai_agents data to document processing result format
        return {
          status: 'completed',
          documentUrl: documentUrl,
          documentType: agent.type || 'unknown',
          clientId: clientId,
          agentName: agent.name || 'AI Assistant',
          startedAt: agent.created_at || new Date().toISOString(),
          completedAt: agent.updated_at || new Date().toISOString(),
          chunks: [],
          metadata: {
            path: documentUrl,
            processedAt: agent.updated_at || new Date().toISOString(),
            method: typeof settings === 'object' && 'processing_method' in settings ? 
              String(settings.processing_method) : 'llamaparse',
            publicUrl: documentUrl,
            totalChunks: 1,
            characterCount: agent.content?.length || 0,
            wordCount: agent.content?.split(/\s+/).length || 0,
            averageChunkSize: agent.content?.length || 0,
            title: typeof settings === 'object' && 'title' in settings ? String(settings.title) : undefined,
            author: typeof settings === 'object' && 'author' in settings ? String(settings.author) : undefined,
            createdAt: typeof settings === 'object' && 'createdAt' in settings ? String(settings.createdAt) : undefined,
            pageCount: typeof settings === 'object' && 'pageCount' in settings ? 
              Number(settings.pageCount) : undefined,
            language: typeof settings === 'object' && 'language' in settings ? String(settings.language) : undefined
          }
        };
      }
      
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
      // Check if the document_processing table exists
      const docProcExists = await tableExists('document_processing');
      
      if (docProcExists) {
        // Query the document_processing table
        let sql = `
          SELECT * FROM document_processing
          WHERE client_id = '${clientId}'
        `;
        
        if (status) {
          sql += ` AND status = '${status}'`;
        }
        
        sql += ` ORDER BY created_at DESC`;
        
        const result = await execSql(sql);
        
        if (result && Array.isArray(result) && result.length > 0) {
          return result.map(convertToDocumentProcessingResult);
        }
      }
      
      // If table doesn't exist or no records found, get from ai_agents as fallback
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('interaction_type', 'document')
        .order('created_at', { ascending: false });
      
      const { data: agentsData, error: agentsError } = await query;
      
      if (agentsError) {
        console.error('Error fetching from ai_agents:', agentsError);
        return [];
      }
      
      if (agentsData && agentsData.length > 0) {
        // Convert ai_agents data to document processing result format
        return agentsData.map(agent => {
          const settings = agent.settings || {};
          
          return {
            status: 'completed',
            documentUrl: agent.url || '',
            documentType: agent.type || 'unknown',
            clientId: clientId,
            agentName: agent.name || 'AI Assistant',
            startedAt: agent.created_at || new Date().toISOString(),
            completedAt: agent.updated_at || new Date().toISOString(),
            chunks: [],
            metadata: {
              path: agent.url || '',
              processedAt: agent.updated_at || new Date().toISOString(),
              method: typeof settings === 'object' && 'processing_method' in settings ? 
                String(settings.processing_method) : 'llamaparse',
              publicUrl: agent.url || '',
              totalChunks: 1,
              characterCount: agent.content?.length || 0,
              wordCount: agent.content?.split(/\s+/).length || 0,
              averageChunkSize: agent.content?.length || 0,
              title: typeof settings === 'object' && 'title' in settings ? String(settings.title) : undefined,
              author: typeof settings === 'object' && 'author' in settings ? String(settings.author) : undefined,
              createdAt: typeof settings === 'object' && 'createdAt' in settings ? String(settings.createdAt) : undefined,
              pageCount: typeof settings === 'object' && 'pageCount' in settings ? 
                Number(settings.pageCount) : undefined,
              language: typeof settings === 'object' && 'language' in settings ? String(settings.language) : undefined
            }
          };
        });
      }
      
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
