
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
      
      // Validate inputs
      if (!documentUrl) {
        throw new Error("Document URL is required");
      }
      
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
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
      
      // Generate a unique document ID
      const documentId = crypto.randomUUID();
      console.log(`Generated document ID: ${documentId} for processing`);
      
      // Call the Edge Function to process the document
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId
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

  /**
   * Check the status of a document processing job
   * @param jobId Job ID
   * @returns Object containing job status
   */
  static async checkDocumentStatus(jobId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke("check-document-status", {
        body: { jobId }
      });
      
      if (error) {
        console.error("Error checking document status:", error);
        return { success: false, error: error.message };
      }
      
      return data;
    } catch (error: any) {
      console.error("Error in checkDocumentStatus:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify the LlamaParse integration is working
   * @returns Object containing verification status
   */
  static async verifyLlamaParseIntegration(): Promise<{ 
    success: boolean; 
    error?: string; 
    data?: Record<string, any> 
  }> {
    try {
      // Call the Edge Function to verify integration
      const { data, error } = await supabase.functions.invoke("verify-llama-parse", {
        body: { timestamp: new Date().toISOString() }
      });

      if (error) {
        console.error("Error verifying LlamaParse integration:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "No data returned from verification" };
      }

      return {
        success: data.success || false,
        data: data.details || data,
        error: data.error
      };
    } catch (error: any) {
      console.error("Error in verifyLlamaParseIntegration:", error);
      return { 
        success: false, 
        error: error.message || "Unknown error occurred during verification" 
      };
    }
  }
}
