
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingOptions, DocumentProcessingResult } from "@/types/document-processing";
import { execSql } from "@/utils/rpcUtils";
import { logClientActivity } from "@/services/clientActivityService";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads and processes a document
 * @param file The file to upload and process
 * @param options Processing options including clientId and processing method
 * @returns Processing result with status and document ID
 */
export const uploadAndProcessDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  try {
    // Validate options
    if (!options.clientId) {
      return {
        success: false,
        status: 'failed',
        error: 'Client ID is required'
      };
    }

    // Generate a unique document ID
    const documentId = uuidv4();
    
    // Upload the file to Supabase Storage
    const filePath = `${options.clientId}/${documentId}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading document:", uploadError);
      
      await logClientActivity(
        options.clientId,
        'document_processing_failed',
        `Failed to upload document: ${file.name}`,
        {
          error: uploadError.message,
          file_name: file.name
        }
      );
      
      return {
        success: false,
        status: 'failed',
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get the URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Create a document processing record
    const { data: processingData, error: processingError } = await supabase
      .from('document_processing')
      .insert([
        {
          id: documentId,
          client_id: options.clientId,
          document_url: publicUrl,
          file_name: file.name,
          document_type: file.type,
          agent_name: options.agentName || 'AI Assistant',
          processing_method: options.processingMethod || 'firecrawl',
          status: 'processing'
        }
      ]) as any; // Use type assertion to bypass the table type checking

    if (processingError) {
      console.error("Error creating document processing record:", processingError);
      
      await logClientActivity(
        options.clientId,
        'document_processing_failed',
        `Failed to process document: ${file.name}`,
        {
          error: processingError.message,
          file_name: file.name
        }
      );
      
      return {
        success: false,
        status: 'failed',
        error: processingError.message
      };
    }

    // Log activity for starting the document processing
    await logClientActivity(
      options.clientId,
      'document_processing_started',
      `Started processing document: ${file.name}`,
      {
        document_id: documentId,
        file_name: file.name,
        document_url: publicUrl,
        processing_method: options.processingMethod || 'firecrawl'
      }
    );

    // Return success with the document ID
    return {
      success: true,
      status: 'processing',
      documentId,
      metadata: {
        file_name: file.name,
        document_url: publicUrl,
        processing_method: options.processingMethod || 'firecrawl'
      }
    };
  } catch (error: any) {
    console.error("Error processing document:", error);
    
    // Log the error
    if (options.clientId) {
      await logClientActivity(
        options.clientId,
        'document_processing_failed',
        `Error processing document: ${error.message}`,
        {
          error: error.message,
          file_name: file.name
        }
      );
    }
    
    return {
      success: false,
      status: 'failed',
      error: error.message
    };
  }
};
