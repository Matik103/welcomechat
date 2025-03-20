
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingResult, LlamaParseResponse } from "@/types/llamaparse";
import { createClientActivity, logAgentError } from "./clientActivityService";
import { ActivityType } from "@/types/activity";

/**
 * Processes a document file for a specific client
 */
export const processDocument = async (
  clientId: string,
  file: File,
  agentName: string
): Promise<DocumentProcessingResult> => {
  try {
    // Log that document processing has started
    await createClientActivity(
      clientId,
      "document_processing_started" as ActivityType,
      `Started processing document: ${file.name}`,
      {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        agent_name: agentName
      }
    );

    // First, upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("client-documents")
      .upload(`${clientId}/${Date.now()}_${file.name}`, file);

    if (uploadError) {
      await logAgentError(
        clientId,
        "document_upload_failed",
        `Failed to upload document: ${uploadError.message}`,
        { file_name: file.name }
      );
      return { status: "failed", error: uploadError.message };
    }

    // Log document stored successfully
    await createClientActivity(
      clientId,
      "document_stored" as ActivityType,
      `Document stored successfully: ${file.name}`,
      {
        file_name: file.name,
        storage_path: uploadData.path
      }
    );

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("client-documents")
      .getPublicUrl(uploadData.path);

    // Store document record in database
    const { data: documentData, error: documentError } = await supabase
      .from("client_documents")
      .insert({
        client_id: clientId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadData.path,
        url: publicUrlData.publicUrl,
        status: "processed"
      })
      .select()
      .single();

    if (documentError) {
      return { status: "failed", error: documentError.message };
    }

    // Log document processing complete
    await createClientActivity(
      clientId,
      "document_processing_completed" as ActivityType,
      `Document processed: ${file.name}`,
      {
        document_id: documentData.id,
        file_name: file.name,
        url: publicUrlData.publicUrl
      }
    );

    return {
      status: "success",
      documentId: documentData.id,
      metadata: {
        fileName: file.name,
        url: publicUrlData.publicUrl
      }
    };
  } catch (error: any) {
    console.error("Error processing document:", error);
    
    // Log the error
    await createClientActivity(
      clientId,
      "document_processing_failed" as ActivityType,
      `Failed to process document: ${file.name}`,
      {
        file_name: file.name,
        error_message: error.message
      }
    );
    
    return {
      status: "failed",
      error: error.message
    };
  }
};
