
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingResult, DocumentProcessingOptions } from '@/types/document-processing';

/**
 * Uploads a document to storage and returns the document ID
 */
export const uploadDocument = async (file: File, options: DocumentProcessingOptions): Promise<string> => {
  try {
    const { clientId, onUploadProgress } = options;
    
    // Create a unique file path
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `clients/${clientId}/documents/${timestamp}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onUploadProgress) {
            onUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        }
      });
    
    if (error) {
      throw error;
    }
    
    // Return the document ID (the file path in this case)
    return data.path;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Processes a document after it has been uploaded
 */
export const processDocument = async (documentId: string, options: DocumentProcessingOptions): Promise<DocumentProcessingResult> => {
  try {
    const { clientId, agentName } = options;
    
    // Log the document processing start
    const { data: logData, error: logError } = await supabase.rpc('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'document_processing_started',
      description_param: `Started processing document ${documentId}`,
      metadata_param: { 
        documentId, 
        agentName 
      }
    });
    
    if (logError) {
      console.error('Error logging document processing start:', logError);
    }
    
    // Call document processing function
    // For this implementation, we're just mocking the result
    // In a real app, you would call an API or Edge Function to process the document
    
    // Mock successful processing
    const result: DocumentProcessingResult = {
      success: true,
      status: 'completed',
      documentId,
      content: `This is the processed content for document ${documentId}`,
      metadata: {
        processedAt: new Date().toISOString(),
        agentName
      }
    };
    
    // Log the document processing completion
    await supabase.rpc('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'document_processing_completed',
      description_param: `Completed processing document ${documentId}`,
      metadata_param: { 
        documentId, 
        agentName,
        status: 'completed'
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Log the document processing failure
    await supabase.rpc('log_client_activity', {
      client_id_param: options.clientId,
      activity_type_param: 'document_processing_failed',
      description_param: `Failed to process document ${documentId}`,
      metadata_param: { 
        documentId, 
        agentName: options.agentName,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    throw error;
  }
};

/**
 * Process a document with LlamaParse
 */
export const processDocumentWithLlamaParse = async (documentId: string, options: DocumentProcessingOptions): Promise<DocumentProcessingResult> => {
  try {
    console.log('Processing document with LlamaParse:', documentId, options);
    
    // In a real implementation, this would call the LlamaParse API
    // For now, we'll just return a mock result
    
    return {
      success: true,
      status: 'completed',
      documentId,
      content: `This is the processed content from LlamaParse for document ${documentId}`,
      metadata: {
        processedAt: new Date().toISOString(),
        processor: 'llamaparse',
        agentName: options.agentName
      }
    };
  } catch (error) {
    console.error('Error processing document with LlamaParse:', error);
    
    return {
      success: false,
      status: 'failed',
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
