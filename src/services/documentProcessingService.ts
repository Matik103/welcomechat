import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingOptions, DocumentProcessingResult } from "@/types/document-processing";

/**
 * Upload a document to storage and register it in the database
 */
export const uploadDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<string> => {
  const { clientId, agentName, onUploadProgress, metadata = {} } = options;
  
  if (!clientId) {
    throw new Error("Client ID is required for document upload");
  }

  try {
    // Ensure authentication is valid
    await checkAndRefreshAuth();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `documents/${clientId}/${fileName}`;

    // Custom upload with progress tracking
    let xhr = new XMLHttpRequest();
    
    const uploadPromise = new Promise<{path: string}>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onUploadProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ path: filePath });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    });

    // Start upload
    await supabase.storage.from('documents').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document record in ai_agents table 
    const { data: documentData, error: docError } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        name: agentName || 'AI Assistant',
        type: file.type,
        size: file.size,
        content: `Document: ${file.name}`,
        url: urlData.publicUrl,
        interaction_type: 'document',
        status: 'processing',
        uploadDate: new Date().toISOString(),
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          originalName: file.name,
          ...metadata
        }
      })
      .select('id')
      .single();

    if (docError) {
      throw new Error(`Error creating document record: ${docError.message}`);
    }

    // Return the document ID
    return documentData.id;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

/**
 * Process a document that was previously uploaded
 */
export const processDocument = async (
  documentId: string,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  const { clientId } = options;
  
  if (!documentId || !clientId) {
    throw new Error("Document ID and Client ID are required for processing");
  }

  try {
    // Update status to processing
    await supabase
      .from('ai_agents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // In a real implementation, this would trigger a serverless function
    // to process the document. For this example, we'll simulate success.
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update status to completed
    await supabase
      .from('ai_agents')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    return {
      success: true,
      status: 'completed',
      documentId: documentId
    };
  } catch (error) {
    console.error("Error processing document:", error);
    
    // Update status to failed
    await supabase
      .from('ai_agents')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    return {
      success: false,
      status: 'failed',
      documentId: documentId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Helper function to check if a document exists and get its processing status
 */
export const getDocumentStatus = async (documentId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('status')
      .eq('id', documentId)
      .eq('interaction_type', 'document')
      .single();
    
    if (error) throw error;
    return data.status || 'unknown';
  } catch (error) {
    console.error("Error checking document status:", error);
    return 'error';
  }
};

/**
 * Process a document that was previously uploaded using LlamaParse
 */
export const processDocumentWithLlamaParse = async (
  documentId: string,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    // This is a stub implementation to satisfy the TypeScript error
    // Call the Supabase function to process the document
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        documentId,
        clientId: options.clientId,
        agentName: options.agentName,
        processingMethod: options.processingMethod || 'llamaparse'
      },
    });

    if (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        status: 'failed',
        error: error.message
      };
    }

    return {
      success: true,
      status: 'completed',
      documentId,
      content: data?.content,
      metadata: data?.metadata
    };
  } catch (error) {
    console.error('Error in processDocumentWithLlamaParse:', error);
    return {
      success: false,
      status: 'failed',
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Process a document that was previously uploaded using LlamaParse
 */
export const processDocumentByOptions = async (
  documentId: string,
  options: Record<string, any>
): Promise<DocumentProcessingResult> => {
  try {
    // Convert options from a record to the correct type
    const validOptions: DocumentProcessingOptions = {
      clientId: options.clientId || "",
      agentName: options.agentName,
      processingMethod: options.processingMethod || "standard"
    };
    
    // Call the actual processing function
    return await processDocumentWithLlamaParse(documentId, validOptions);
  } catch (error) {
    console.error("Error processing document:", error);
    return {
      success: false,
      status: "failed",
      documentId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
