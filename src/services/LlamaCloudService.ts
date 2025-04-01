
import { supabase } from "@/integrations/supabase/client";
import { ensurePublicUrl } from "@/utils/supabaseStorage";
import { toast } from "sonner";
import { LlamaParseError } from "@/utils/errors";
import { ParseResponse } from "@/types/document-processing";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { DOCUMENTS_BUCKET } from "@/utils/supabaseStorage";

interface ParseDocumentResult {
  success: boolean;
  error?: string;
  jobId?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export class LlamaCloudService {
  /**
   * Parse a document using LlamaParse
   * @param documentUrl URL of the document to parse
   * @param documentType Type of document (pdf, docx, etc)
   * @param clientId Client ID
   * @param agentName Agent name for association
   * @returns Object containing success status and error message if applicable
   */
  static async parseDocument(
    documentUrl: string,
    documentType: string,
    clientId: string,
    agentName: string
  ): Promise<ParseDocumentResult> {
    try {
      console.log(`Parsing document: ${documentUrl} (type: ${documentType})`);
      
      // Ensure we're using the correct bucket name when dealing with Supabase storage URLs
      if (documentUrl.includes(SUPABASE_URL + '/storage/v1/object/public/')) {
        try {
          // Extract the path and ensure it's a valid Supabase storage URL
          const bucketPath = documentUrl.split('/storage/v1/object/public/')[1];
          if (bucketPath) {
            const [bucket, ...pathParts] = bucketPath.split('/');
            // Verify we're using the correct bucket
            if (bucket !== DOCUMENTS_BUCKET) {
              console.warn(`Document URL uses bucket "${bucket}" instead of "${DOCUMENTS_BUCKET}"`);
            }
          }
        } catch (error) {
          console.warn("Failed to parse Supabase storage URL:", error);
        }
      }
      
      // Call the Edge Function to process the document
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId: crypto.randomUUID()
        }
      });
      
      if (error) {
        console.error("Error invoking process-document function:", error);
        return {
          success: false,
          error: error.message
        };
      }
      
      // Validate the response
      if (!data) {
        return {
          success: false,
          error: "No data returned from document processing"
        };
      }
      
      console.log("Document processing response:", data);
      
      return {
        success: data.success || false,
        jobId: data.jobId,
        content: data.content,
        metadata: data.metadata,
        error: data.error
      };
    } catch (error: any) {
      console.error("Error in parseDocument:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred while processing document"
      };
    }
  }
}
