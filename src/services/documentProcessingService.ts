
import { supabase } from "@/integrations/supabase/client";
import { DocumentProcessingResult, DocumentType } from "@/types/document-processing";
import { ActivityType } from "@/types/client-form";
import { Json } from "@/integrations/supabase/types";
import { callRpcFunctionSafe } from "@/utils/rpcUtils";

// Process document via edge function
export async function processDocument(
  clientId: string,
  documentUrl: string,
  documentType: DocumentType,
  agentName: string
): Promise<DocumentProcessingResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "process-document",
      {
        body: {
          clientId,
          documentUrl,
          documentType,
          agentName,
        },
      }
    );

    if (error) {
      console.error("Error processing document:", error);
      return {
        success: false,
        error: error.message,
        processed: 0,
        failed: 1,
      };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      const result = data as any;
      
      // Log activity for the document processing
      await callRpcFunctionSafe("log_client_activity", {
        client_id_param: clientId,
        activity_type_param: result.success ? "document_processed" : "document_processing_failed",
        description_param: result.success
          ? `Successfully processed document: ${documentUrl}`
          : `Failed to process document: ${documentUrl}`,
        metadata_param: {
          document_url: documentUrl,
          document_type: documentType,
          agent_name: agentName,
          error: result.error || null,
          activity_id: result.activity_id || null,
        },
      });

      return {
        success: result.success,
        error: result.error || null,
        processed: result.processed || 0,
        failed: result.failed || 0,
        jobId: result.jobId || undefined,
      };
    }

    return {
      success: false,
      error: "Invalid response from document processing service",
      processed: 0,
      failed: 1,
    };
  } catch (error) {
    console.error("Error calling process-document function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      processed: 0,
      failed: 1,
    };
  }
}

// Upload document to storage for processing
export async function uploadAndProcessDocument(
  clientId: string,
  file: File,
  agentName: string
): Promise<DocumentProcessingResult> {
  try {
    // Upload the file first
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = `${clientId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading document:", uploadError);
      return {
        success: false,
        error: uploadError.message,
        processed: 0,
        failed: 1,
      };
    }

    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return {
        success: false,
        error: "Failed to get public URL for uploaded document",
        processed: 0,
        failed: 1,
      };
    }

    // Create a processing job
    const { data: jobData, error: jobError } = await supabase
      .from("document_processing_jobs")
      .insert({
        client_id: clientId,
        document_url: urlData.publicUrl,
        document_type: "document",
        document_id: filePath,
        agent_name: agentName,
        status: "pending",
        processing_method: "direct_upload",
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating processing job:", jobError);
      return {
        success: false,
        error: jobError.message,
        processed: 0,
        failed: 1,
      };
    }

    // Process the document
    return await processDocument(
      clientId,
      urlData.publicUrl,
      "document" as DocumentType,
      agentName
    );
  } catch (error) {
    console.error("Error in uploadAndProcessDocument:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      processed: 0,
      failed: 1,
    };
  }
}

// Check the status of a document processing job
export async function checkDocumentProcessingStatus(
  jobId: string
): Promise<{ status: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("document_processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error checking document processing status:", error);
      return { status: "error", error: error.message };
    }

    return {
      status: data.status,
      error: data.error || undefined,
    };
  } catch (error) {
    console.error("Error in checkDocumentProcessingStatus:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a document
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("document_processing_jobs")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("Error deleting document:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
