
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingResult, DocumentProcessingOptions } from "@/types/document-processing";
import { v4 as uuidv4 } from "uuid";
import { logAgentError } from "./clientActivityService";
import { Json } from "@/integrations/supabase/types";

// Upload document to Supabase storage and then process it
export const uploadAndProcessDocument = async (
  file: File,
  options: DocumentProcessingOptions
): Promise<DocumentProcessingResult> => {
  const { clientId, agentName = "AI Assistant", processingMethod = "firecrawl" } = options;
  const documentId = uuidv4();

  try {
    // Step 1: Upload file to Supabase Storage
    const fileName = `${clientId}/${documentId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("document-processing")
      .upload(fileName, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      await logAgentError(
        clientId,
        "document_upload_failed",
        `Failed to upload document: ${uploadError.message}`,
        { file_name: file.name }
      );
      
      return {
        success: false,
        status: "failed",
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Step 2: Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("document-processing")
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      const errorMsg = "Failed to get public URL for uploaded document";
      console.error(errorMsg);
      
      await logAgentError(
        clientId,
        "document_processing_failed",
        errorMsg,
        { file_name: file.name }
      );
      
      return {
        success: false,
        status: "failed",
        error: errorMsg
      };
    }

    // Step 3: Call Edge Function to process the document
    const { data: processingData, error: processingError } = await supabase.functions.invoke(
      "process-document",
      {
        body: {
          document_url: publicUrlData.publicUrl,
          document_id: documentId,
          document_type: file.type,
          client_id: clientId,
          agent_name: agentName,
          processing_method: processingMethod
        }
      }
    );

    if (processingError) {
      console.error("Processing error:", processingError);
      
      await logAgentError(
        clientId,
        "document_processing_failed",
        `Failed to process document: ${processingError.message}`,
        { file_name: file.name, document_id: documentId }
      );
      
      return {
        success: false,
        status: "failed",
        error: `Processing failed: ${processingError.message}`
      };
    }

    // Step 4: Store document metadata in database
    const { error: storeError } = await supabase.from("document_processing").insert({
      document_id: documentId,
      document_url: publicUrlData.publicUrl,
      document_type: file.type,
      client_id: clientId,
      agent_name: agentName,
      status: "processing",
      processing_method: processingMethod,
      metadata: {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      }
    });

    if (storeError) {
      console.error("Storage error:", storeError);
      
      await logAgentError(
        clientId,
        "document_metadata_storage_failed",
        `Failed to store document metadata: ${storeError.message}`,
        { file_name: file.name, document_id: documentId }
      );
      
      return {
        success: false,
        status: "failed",
        error: `Metadata storage failed: ${storeError.message}`
      };
    }

    // Step 5: Return success with document ID
    return {
      success: true,
      status: "processing",
      documentId,
      metadata: {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        document_url: publicUrlData.publicUrl
      }
    };
  } catch (error: any) {
    console.error("Unexpected error during document processing:", error);
    
    await logAgentError(
      clientId,
      "document_processing_exception",
      `Unexpected error during document processing: ${error.message}`,
      { file_name: file.name }
    );
    
    return {
      success: false,
      status: "failed",
      error: `Unexpected error: ${error.message}`
    };
  }
};
