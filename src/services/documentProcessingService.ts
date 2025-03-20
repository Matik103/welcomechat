
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { DocumentProcessingOptions, DocumentProcessingResult } from "@/types/document-processing";
import { logClientActivity } from "@/services/clientActivityService";
import { toast } from "sonner";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Main function to upload and process a document
 */
export async function uploadAndProcessDocument(
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> {
  const { clientId, agentName, onUploadProgress } = options;
  
  if (!clientId) {
    return { 
      success: false,
      status: "failed", 
      error: "Client ID is required" 
    };
  }

  try {
    const documentId = uuidv4();
    
    // Log document upload start
    await logClientActivity(
      clientId,
      'document_processing_started',
      `Started processing document: ${file.name}`,
      {
        document_id: documentId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        agent_name: agentName || 'default'
      }
    );

    // Upload file to storage
    const fileUploadResult = await uploadFileToStorage(file, clientId, documentId, onUploadProgress);
    
    if (!fileUploadResult.path) {
      return { 
        success: false,
        status: "failed", 
        error: "Failed to upload file to storage" 
      };
    }

    // Process document based on type
    let processingResult: DocumentProcessingResult;
    
    if (file.type.includes('pdf')) {
      processingResult = await processDocumentWithLlamaParse(fileUploadResult.path, clientId, documentId, agentName);
    } else {
      processingResult = await processDocumentGeneric(fileUploadResult.path, clientId, documentId, agentName);
    }

    if (!processingResult.success) {
      // Log processing failure
      await logClientActivity(
        clientId,
        'document_processing_failed',
        `Failed to process document: ${file.name}`,
        {
          document_id: documentId,
          error: processingResult.error,
          file_name: file.name
        }
      );
    } else {
      // Log processing success
      await logClientActivity(
        clientId,
        'document_processing_completed',
        `Successfully processed document: ${file.name}`,
        {
          document_id: documentId,
          file_name: file.name,
          metadata: processingResult.metadata
        }
      );
    }

    return processingResult;
  } catch (error) {
    console.error("Error in uploadAndProcessDocument:", error);
    return { 
      success: false,
      status: "failed", 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Upload a file to Supabase storage
 */
async function uploadFileToStorage(
  file: File, 
  clientId: string, 
  documentId: string,
  onUploadProgress?: (progress: number) => void
): Promise<{ url: string; path: string }> {
  try {
    const fileExtension = file.name.split('.').pop();
    const filePath = `documents/${clientId}/${documentId}.${fileExtension}`;
    
    const { data, error } = await supabase.storage
      .from('client-documents')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: onUploadProgress ? 
          ({ progress }) => onUploadProgress(progress) : undefined
      });
    
    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
    
    const { data: urlData } = await supabase.storage
      .from('client-documents')
      .getPublicUrl(filePath);
    
    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error("Error in uploadFileToStorage:", error);
    throw error;
  }
}

/**
 * Process a document with LlamaParse for high-quality PDF extraction
 */
export async function processDocumentWithLlamaParse(
  filePath: string, 
  clientId: string, 
  documentId: string,
  agentName?: string
): Promise<DocumentProcessingResult> {
  try {
    // This is a stub implementation - in a real app you would call an actual service
    console.log("Processing document with LlamaParse:", filePath);
    
    // Call the RPC function that would trigger the processing
    const result = await callRpcFunction<{success: boolean, document_id: string}>('process_document', {
      file_path: filePath,
      client_id: clientId,
      document_id: documentId,
      agent_name: agentName || 'default',
      processing_method: 'llamaparse'
    });
    
    if (!result || !result.success) {
      throw new Error("Document processing failed");
    }
    
    return {
      success: true,
      status: "processing",
      documentId: documentId,
      metadata: {
        processingMethod: "llamaparse",
        filePath
      }
    };
  } catch (error) {
    console.error("Error in processDocumentWithLlamaParse:", error);
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process a generic document (non-PDF)
 */
async function processDocumentGeneric(
  filePath: string, 
  clientId: string, 
  documentId: string,
  agentName?: string
): Promise<DocumentProcessingResult> {
  try {
    // Call the RPC function that would trigger the processing
    const result = await callRpcFunction<{success: boolean, document_id: string}>('process_document', {
      file_path: filePath,
      client_id: clientId,
      document_id: documentId,
      agent_name: agentName || 'default',
      processing_method: 'generic'
    });
    
    if (!result || !result.success) {
      throw new Error("Document processing failed");
    }
    
    return {
      success: true,
      status: "processing",
      documentId: documentId,
      metadata: {
        processingMethod: "generic",
        filePath
      }
    };
  } catch (error) {
    console.error("Error in processDocumentGeneric:", error);
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
