
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { callRpcFunctionSafe } from "@/utils/rpcUtils";

export async function checkDocumentStatus(documentId: string) {
  try {
    const { data, error } = await supabase
      .from("document_processing_jobs")
      .select("status, error, metadata")
      .eq("document_id", documentId)
      .single();

    if (error) {
      console.error("Error checking document status:", error);
      return { status: "error", error: error.message };
    }

    return {
      status: data.status,
      error: data.error,
      metadata: data.metadata
    };
  } catch (error) {
    console.error("Error in checkDocumentStatus:", error);
    return { status: "error", error: "Failed to check document status" };
  }
}

export async function createDocumentProcessingJob(
  clientId: string,
  documentUrl: string,
  documentType: string,
  agentName: string = "AI Assistant"
) {
  try {
    // Generate a unique document ID
    const documentId = uuidv4();
    
    // Create a processing job
    const { data, error } = await supabase
      .from("document_processing_jobs")
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        document_id: documentId,
        agent_name: agentName,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error("Error creating document processing job:", error);
      throw error;
    }

    // Log the document processing activity
    await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'document_processing_started',
      description_param: `Started processing ${documentType} document`,
      metadata_param: { documentUrl, documentType }
    });

    return { 
      success: true, 
      jobId: documentId,
      data: data[0]
    };
  } catch (error) {
    console.error("Error in createDocumentProcessingJob:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function cancelDocumentProcessing(documentId: string) {
  try {
    const { error } = await supabase
      .from("document_processing_jobs")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("document_id", documentId);

    if (error) {
      console.error("Error cancelling document processing:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in cancelDocumentProcessing:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
