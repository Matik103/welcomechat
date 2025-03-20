import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingResult, DocumentProcessingOptions } from "@/types/document-processing";
import { createClientActivity } from "./clientActivityService";
import { checkAndRefreshAuth } from "./authService";

/**
 * Process a document with LlamaParse
 * @param documentId The document ID to process
 * @param options Processing options
 * @returns Processing result
 */
export const processDocumentWithLlamaParse = async (documentId: string, options: any): Promise<any> => {
  try {
    console.log("Processing document with LlamaParse:", documentId, options);
    
    // This is a placeholder implementation
    // In a real implementation, you would call a service or API to process the document
    return {
      success: true,
      status: 'completed',
      documentId,
      content: "This is placeholder content from LlamaParse processing"
    };
  } catch (error) {
    console.error("Error processing document with LlamaParse:", error);
    return {
      success: false,
      status: 'failed',
      documentId,
      error: String(error)
    };
  }
};

/**
 * Upload and process a document
 * @param file The file to upload and process
 * @param options Processing options
 * @returns Processing result
 */
export const uploadAndProcessDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    await checkAndRefreshAuth();
    
    const { clientId, agentName, onUploadProgress } = options;
    
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    
    // Log the start of document processing
    await createClientActivity(
      clientId,
      "document_processing_started",
      `Started processing document: ${file.name}`,
      {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        agent_name: agentName
      }
    );
    
    // Create a unique file name
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `documents/${clientId}/${fileName}`;
    
    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        onUploadProgress: (progress) => {
          if (onUploadProgress) {
            const percentage = (progress.loaded / progress.total) * 100;
            onUploadProgress(percentage);
          }
        }
      });
    
    if (uploadError) {
      console.error("Error uploading document:", uploadError);
      
      await createClientActivity(
        clientId,
        "document_processing_failed",
        `Failed to upload document: ${file.name}`,
        {
          file_name: file.name,
          error: uploadError.message,
          agent_name: agentName
        }
      );
      
      return {
        success: false,
        status: 'failed',
        error: `Upload failed: ${uploadError.message}`
      };
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('client-documents')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData?.publicUrl;
    
    // Store document metadata in the database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        public_url: publicUrl,
        status: 'uploaded',
        agent_name: agentName
      })
      .select()
      .single();
    
    if (documentError) {
      console.error("Error storing document metadata:", documentError);
      
      await createClientActivity(
        clientId,
        "document_processing_failed",
        `Failed to store document metadata: ${file.name}`,
        {
          file_name: file.name,
          error: documentError.message,
          agent_name: agentName
        }
      );
      
      return {
        success: false,
        status: 'failed',
        error: `Failed to store document metadata: ${documentError.message}`
      };
    }
    
    // Log successful document storage
    await createClientActivity(
      clientId,
      "document_stored",
      `Document stored successfully: ${file.name}`,
      {
        file_name: file.name,
        document_id: documentData.id,
        file_path: filePath,
        agent_name: agentName
      }
    );
    
    // Process the document based on the processing method
    const processingMethod = options.processingMethod || 'default';
    let processingResult: DocumentProcessingResult;
    
    if (processingMethod === 'llamaparse') {
      processingResult = await processDocumentWithLlamaParse(documentData.id, options);
    } else {
      // Default processing method
      processingResult = {
        success: true,
        status: 'completed',
        documentId: documentData.id
      };
    }
    
    // Update document status based on processing result
    await supabase
      .from('documents')
      .update({
        status: processingResult.success ? 'processed' : 'failed',
        processing_error: processingResult.error
      })
      .eq('id', documentData.id);
    
    // Log the completion of document processing
    await createClientActivity(
      clientId,
      processingResult.success ? "document_processing_completed" : "document_processing_failed",
      processingResult.success 
        ? `Document processed successfully: ${file.name}`
        : `Document processing failed: ${file.name}`,
      {
        file_name: file.name,
        document_id: documentData.id,
        error: processingResult.error,
        agent_name: agentName
      }
    );
    
    return {
      ...processingResult,
      documentId: documentData.id
    };
  } catch (error) {
    console.error("Error in uploadAndProcessDocument:", error);
    
    // Try to log the error if we have a client ID
    if (options.clientId) {
      await createClientActivity(
        options.clientId,
        "document_processing_failed",
        `Document processing error: ${error instanceof Error ? error.message : String(error)}`,
        {
          file_name: file.name,
          error: error instanceof Error ? error.message : String(error),
          agent_name: options.agentName
        }
      ).catch(console.error);
    }
    
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
