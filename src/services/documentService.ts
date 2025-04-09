import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from '@/config/env';

// Constants for file processing
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_PARALLEL_CHUNKS = 3;

interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  processed?: number;
  failed?: number;
  documentUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface UploadOptions {
  agentName?: string;
  shouldProcessWithOpenAI?: boolean;
  onProgress?: (progress: number) => void;
}

interface DocumentMetadata {
  clientId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  processing_status?: string;
  extraction_method?: string;
  text_length?: number;
  [key: string]: any;
}

/**
 * Splits a PDF file into chunks for processing
 */
async function splitPDFIntoChunks(file: File, maxChunkSize: number): Promise<Blob[]> {
  const chunks: Blob[] = [];
  let offset = 0;
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + maxChunkSize);
    chunks.push(chunk);
    offset += maxChunkSize;
  }
  
  return chunks;
}

/**
 * Process a single chunk with retries
 */
async function processChunkWithRetry(
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  retries = MAX_RETRIES
): Promise<string | null> {
  try {
    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.size} bytes)`);
    
    const formData = new FormData();
    // Create a new File with PDF extension to ensure proper processing
    const chunkFile = new File([chunk], `chunk-${chunkIndex + 1}.pdf`, { type: 'application/pdf' });
    formData.append('file', chunkFile);
    
    const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
      method: 'POST',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Chunk ${chunkIndex + 1} failed with status:`, response.status, errorText);
      
      if (retries > 0) {
        console.log(`Retrying chunk ${chunkIndex + 1} (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return processChunkWithRetry(chunk, chunkIndex, totalChunks, retries - 1);
      }
      
      throw new Error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries`);
    }
    
    const extractedText = await response.text();
    console.log(`Chunk ${chunkIndex + 1} processed successfully, length:`, extractedText.length);
    return extractedText;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying chunk ${chunkIndex + 1} after error (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return processChunkWithRetry(chunk, chunkIndex, totalChunks, retries - 1);
    }
    console.error(`Failed to process chunk ${chunkIndex + 1}:`, error);
    return null;
  }
}

/**
 * Process a PDF file and extract its text content
 * Handles files of any size through chunking and parallel processing
 */
async function processPDF(file: File, onProgress?: (progress: number) => void): Promise<string | null> {
  try {
    console.log(`Processing PDF file: ${file.name} (${file.size} bytes)`);
    
    // For small files, process directly
    if (file.size <= 5 * 1024 * 1024) { // 5MB threshold for direct processing
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
        method: 'POST',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`PDF extraction failed with status: ${response.status}`);
      }
      
      const extractedText = await response.text();
      console.log('PDF text extraction successful, length:', extractedText.length);
      onProgress?.(100);
      return extractedText;
    }
    
    // For large files, use chunking
    console.log('Large PDF detected, using chunked processing');
    const chunks = await splitPDFIntoChunks(file, 5 * 1024 * 1024); // 5MB chunks
    const totalChunks = chunks.length;
    let processedChunks = 0;
    let results: string[] = [];
    
    // Process chunks in parallel with limited concurrency
    for (let i = 0; i < chunks.length; i += MAX_PARALLEL_CHUNKS) {
      const chunkGroup = chunks.slice(i, i + MAX_PARALLEL_CHUNKS);
      const chunkPromises = chunkGroup.map((chunk, index) => 
        processChunkWithRetry(chunk, i + index, totalChunks)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      processedChunks += chunkGroup.length;
      
      // Update progress
      const progress = Math.round((processedChunks / totalChunks) * 100);
      onProgress?.(progress);
      
      // Check for failed chunks
      if (chunkResults.some(result => result === null)) {
        throw new Error('Some chunks failed to process');
      }
      
      results = results.concat(chunkResults as string[]);
    }
    
    const combinedText = results.join('\n');
    console.log('All chunks processed successfully, total length:', combinedText.length);
    return combinedText;
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    return null;
  }
}

/**
 * Unified document upload service that handles storage and database updates
 */
export const uploadDocument = async (
  clientId: string, 
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }

    console.log('Starting document upload for client:', clientId);

    // Generate a unique file path using UUID
    const uniqueId = crypto.randomUUID();
    const filePath = `${clientId}/${uniqueId}/${file.name}`;
    
    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return { 
        success: false, 
        error: uploadError.message,
        fileName: file.name,
        fileType: file.type
      };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    // Get the client's assistant
    const { data: assistantData, error: assistantError } = await supabase
      .from('ai_agents')
      .select('openai_assistant_id, name')
      .eq('client_id', clientId)
      .single();
      
    if (assistantError) {
      console.error('Error finding assistant for client:', assistantError);
      // Continue anyway, we'll just store the document without associating with assistant
    }

    // Extract text if it's a PDF file
    let extractedText = null;
    let processingStatus = 'ready';
    
    if (file.type === 'application/pdf') {
      processingStatus = 'pending_extraction';
      
      try {
        if (!RAPIDAPI_KEY) {
          console.error('RapidAPI key is missing. PDF text extraction cannot be performed.');
          processingStatus = 'extraction_failed';
          throw new Error('RapidAPI key is missing');
        }
        
        extractedText = await processPDF(file);
        processingStatus = extractedText ? 'extraction_complete' : 'extraction_failed';
        
      } catch (extractError) {
        console.error('Error extracting PDF text:', extractError);
        processingStatus = 'extraction_failed';
      }
    }

    // Store document metadata in the document_content table
    const { data: documentData, error: documentError } = await supabase
      .from('document_content')
      .insert({
        client_id: clientId,
        document_id: uniqueId,
        content: extractedText,
        filename: file.name,
        file_type: file.type,
        metadata: {
          size: file.size,
          storage_path: filePath,
          storage_url: publicUrl,
          uploadedAt: new Date().toISOString(),
          processing_status: processingStatus,
          extraction_method: file.type === 'application/pdf' ? 'rapidapi' : null,
          text_length: extractedText ? extractedText.length : 0,
          extracted_at: extractedText ? new Date().toISOString() : null
        }
      })
      .select()
      .single();

    if (documentError) {
      console.error('Error storing document metadata:', documentError);
      
      // Try to clean up the uploaded file
      const { error: removeError } = await supabase.storage
        .from('client_documents')
        .remove([filePath]);
        
      if (removeError) {
        console.error('Failed to clean up file after document error:', removeError);
      }
      
      return { 
        success: false, 
        error: documentError.message,
        fileName: file.name,
        fileType: file.type
      };
    }

    // If we have an assistant, associate the document with it
    if (assistantData?.openai_assistant_id) {
      const { error: assistantDocError } = await supabase
        .from('assistant_documents')
        .insert({
          assistant_id: assistantData.openai_assistant_id,
          client_id: clientId,
          filename: file.name,
          file_type: file.type,
          storage_path: filePath,
          metadata: {
            size: file.size,
            storage_url: publicUrl,
            uploadedAt: new Date().toISOString(),
            has_extracted_text: extractedText !== null
          },
          status: processingStatus === 'extraction_complete' ? 'ready' : processingStatus
        });

      if (assistantDocError) {
        console.error('Error associating document with assistant:', assistantDocError);
        // Continue anyway, the document is already stored
      }
    }

    return {
      success: true,
      documentId: documentData.id.toString(),
      documentUrl: publicUrl,
      fileName: file.name,
      fileType: file.type,
      processed: 1,
      failed: 0
    };
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document upload',
      processed: 0,
      failed: 1,
      fileName: file.name,
      fileType: file.type
    };
  }
};

export async function getDocumentContent(documentId: string) {
  const { data, error } = await supabase
    .from('document_content')
    .select('*')
    .eq('id', parseInt(documentId))
    .single();

  if (error) {
    throw new Error(`Failed to fetch document content: ${error.message}`);
  }

  return data;
}

export async function updateDocumentContent(documentId: string, content: string, metadata: DocumentMetadata) {
  const { error } = await supabase
    .from('document_content')
    .update({ 
      content,
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', parseInt(documentId));

  if (error) {
    throw new Error(`Failed to update document content: ${error.message}`);
  }
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('document_content')
    .delete()
    .eq('id', parseInt(documentId));

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
