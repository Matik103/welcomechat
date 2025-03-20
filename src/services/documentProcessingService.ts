
import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessingOptions, DocumentProcessingResult } from '@/types/document-processing';
import { callRpcFunction } from '@/utils/rpcUtils';
import { LlamaParseResponse } from '@/types/llamaparse';

/**
 * Process document using LlamaParse service
 */
export const processDocumentWithLlamaParse = async (
  documentId: string, 
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  console.log(`Processing document ${documentId} with LlamaParse`);
  
  try {
    // Log the processing start activity
    await callRpcFunction('log_client_activity', {
      client_id_param: options.clientId,
      activity_type_param: 'document_processing_started',
      description_param: `Started processing document ${documentId}`,
      metadata_param: {
        document_id: documentId,
        agent_name: options.agentName,
        processing_method: options.processingMethod
      }
    });

    // Simulate processing - in a real implementation, this would call an external API
    // Wait a bit to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock a successful result
    const mockResult: DocumentProcessingResult = {
      success: true,
      status: 'completed',
      documentId,
      content: `This is the processed content of document ${documentId}`,
      metadata: {
        title: 'Sample Document',
        pages: 5,
        wordCount: 1250,
        processingTime: '1.5s'
      }
    };
    
    // Log the processing completion activity
    await callRpcFunction('log_client_activity', {
      client_id_param: options.clientId,
      activity_type_param: 'document_processing_completed',
      description_param: `Completed processing document ${documentId}`,
      metadata_param: {
        document_id: documentId,
        agent_name: options.agentName,
        processing_method: options.processingMethod,
        success: true
      }
    });
    
    return mockResult;
  } catch (error) {
    console.error('Error processing document with LlamaParse:', error);
    
    // Log the processing failure activity
    await callRpcFunction('log_client_activity', {
      client_id_param: options.clientId,
      activity_type_param: 'document_processing_failed',
      description_param: `Failed to process document ${documentId}`,
      metadata_param: {
        document_id: documentId,
        agent_name: options.agentName,
        processing_method: options.processingMethod,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      success: false,
      status: 'failed',
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Upload and process a document
 */
export const uploadAndProcessDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${options.clientId}/${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }
    
    // 2. Get public URL
    const { data: publicURLData } = await supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
      
    const publicUrl = publicURLData?.publicUrl;
    
    // 3. Store document metadata
    const { data: documentData, error: documentError } = await supabase
      .from('ai_documents')
      .insert({
        client_id: options.clientId,
        agent_name: options.agentName,
        file_name: file.name,
        file_type: fileExt,
        file_size: file.size,
        storage_path: fileName,
        public_url: publicUrl,
        status: 'uploaded'
      })
      .select()
      .single();
      
    if (documentError) {
      throw new Error(`Error storing document metadata: ${documentError.message}`);
    }
    
    // 4. Process the document
    const documentId = documentData.id.toString();
    
    // Log document upload activity
    await callRpcFunction('log_client_activity', {
      client_id_param: options.clientId,
      activity_type_param: 'document_uploaded',
      description_param: `Uploaded document: ${file.name}`,
      metadata_param: {
        document_id: documentId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        agent_name: options.agentName
      }
    });
    
    // Process the document - this would be a separate call in a real implementation
    return await processDocumentWithLlamaParse(documentId, options);
  } catch (error) {
    console.error('Error uploading and processing document:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
