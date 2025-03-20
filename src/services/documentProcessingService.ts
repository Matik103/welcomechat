
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';
import { LlamaParseRequest, LlamaParseResponse } from '@/types/llamaparse';
import { supabase } from '@/integrations/supabase/client';

/**
 * Process a document with LlamaParse
 * @param file The file to process
 * @param options Processing options
 * @returns Processing result
 */
export const processDocumentWithLlamaParse = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    console.log("Processing document with LlamaParse:", file.name);
    
    // Create a form data object for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata to request if needed
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }
    
    // Track progress if a callback is provided
    const requestOptions: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {
        // API key is added in the serverless function
      }
    };

    // Call our serverless function for document processing
    const response = await fetch(`/api/process-document`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process document');
    }
    
    // Store document in our database
    await storeProcessedDocument(file.name, data, options);
    
    // Return processing result
    return {
      success: true,
      status: data.status,
      documentId: data.documentId,
      content: data.content,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      status: 'failed',
      error: (error as Error).message
    };
  }
};

/**
 * Store a processed document in the database
 * @param fileName The file name
 * @param parseResult The parsing result
 * @param options Processing options
 * @returns Success or failure
 */
const storeProcessedDocument = async (
  fileName: string,
  parseResult: LlamaParseResponse,
  options: DocumentProcessingOptions
): Promise<boolean> => {
  try {
    // Store document in document_processing_jobs table
    const uploadResult = await supabase
      .from('document_processing_jobs')
      .insert({
        client_id: options.clientId,
        agent_name: options.agentName || 'Default',
        document_id: parseResult.documentId || '',
        document_type: 'pdf',
        document_url: fileName,
        content: parseResult.content || '',
        status: parseResult.status || 'completed',
        error: parseResult.error || null,
        processing_method: 'llamaparse',
        metadata: parseResult.metadata || {}
      });

    if (uploadResult.error) {
      console.error("Error saving document:", uploadResult.error);
      return false;
    }

    // Log client activity
    if (options.clientId) {
      const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
          client_id: options.clientId,
          activity_type: 'document_processed',
          description: `Document "${fileName}" processed successfully`,
          metadata: {
            document_id: parseResult.documentId,
            document_type: 'pdf',
            status: parseResult.status
          }
        });

      if (activityError) {
        console.error("Error logging document activity:", activityError);
      }
    }

    return true;
  } catch (error) {
    console.error("Error storing document:", error);
    return false;
  }
};

/**
 * Process document using the appropriate method
 * @param file The file to process
 * @param options Processing options
 * @returns Processing result
 */
export const processDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  // For now, we'll just use LlamaParse for document processing
  return processDocumentWithLlamaParse(file, options);
};
