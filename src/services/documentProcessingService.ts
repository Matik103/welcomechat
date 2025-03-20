
import { supabase } from "@/integrations/supabase/client";
import { LlamaParseConfig, LlamaParseRequest, LlamaParseResponse, DocumentProcessingResult } from "@/types/llamaparse";
import { createClientActivity, logAgentError } from "./clientActivityService";

export const processDocumentWithLlamaParse = async (
  file: File,
  clientId: string,
  agentName?: string
): Promise<DocumentProcessingResult> => {
  try {
    // Log document processing started
    await createClientActivity(
      clientId,
      "document_processing_started",
      `Started processing document: ${file.name}`,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    );

    // Fetch the LlamaParse API key from the environment
    const { data, error } = await supabase
      .functions
      .invoke("get-llamaparse-api-key", {
        body: { clientId }
      });

    if (error || !data?.apiKey) {
      console.error("Error fetching LlamaParse API key:", error || "No API key returned");
      await logAgentError(
        clientId,
        "llamaparse_api_key_error",
        "Failed to fetch LlamaParse API key",
        { error: error?.message || "No API key returned" }
      );
      return { status: "failed", error: "Configuration error" };
    }

    // Create a form data object
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mimeType", file.type);

    // Set up the API call to LlamaParse
    const response = await fetch("https://api.llamaindex.ai/v1/process_file", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${data.apiKey}`
      },
      body: formData
    });

    // Handle API response
    if (!response.ok) {
      const errorData = await response.json();
      console.error("LlamaParse API error:", errorData);
      await logAgentError(
        clientId,
        "llamaparse_api_error",
        errorData.error?.message || "Unknown LlamaParse API error",
        errorData
      );
      return { status: "failed", error: errorData.error?.message || "Processing failed" };
    }

    // Parse successful response
    const result = await response.json();

    // Store document in database
    const { data: docData, error: docError } = await supabase
      .from("ai_documents")
      .insert({
        client_id: clientId,
        agent_name: agentName,
        file_name: file.name,
        content: result.data?.content || "",
        document_id: result.id,
        status: "processed",
        metadata: {
          title: result.data?.metadata?.title,
          author: result.data?.metadata?.author,
          pages: result.data?.metadata?.pages,
          words: result.data?.metadata?.words,
          fileSize: file.size,
          fileType: file.type
        }
      })
      .select("id")
      .single();

    if (docError) {
      console.error("Error storing document:", docError);
      await createClientActivity(
        clientId,
        "document_processing_failed",
        `Failed to store processed document: ${file.name}`,
        {
          fileName: file.name,
          error: docError.message
        }
      );
      return { status: "failed", error: "Failed to store document" };
    }

    // Log document processing completion
    await createClientActivity(
      clientId,
      "document_processing_completed",
      `Successfully processed document: ${file.name}`,
      {
        fileName: file.name,
        documentId: result.id,
        title: result.data?.metadata?.title,
        pages: result.data?.metadata?.pages
      }
    );

    return {
      status: "success",
      documentId: docData.id.toString(),
      content: result.data?.content,
      metadata: result.data?.metadata
    };
  } catch (error: any) {
    console.error("Document processing error:", error);
    await logAgentError(
      clientId,
      "document_processing_error",
      error.message || "Unknown error during document processing",
      { fileName: file.name }
    );
    return { status: "failed", error: error.message || "Unknown error" };
  }
};
