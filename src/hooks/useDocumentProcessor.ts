
import { useState } from "react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { toast } from "sonner";

interface ProcessDocumentParams {
  documentUrl: string;
  documentType: string;
  clientId: string;
  agentName: string;
  documentId: string;
}

export function useDocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processDocument = async (params: ProcessDocumentParams) => {
    try {
      setIsProcessing(true);
      
      // Check if document type is a Google Drive folder
      let documentType = params.documentType;
      if (documentType === "google_drive" && params.documentUrl.includes("/folders/")) {
        documentType = "google_drive_folder";
        toast.info("Google Drive folder detected - processing all documents in folder");
      }
      
      // Call the Edge Function to process the document
      const response = await FirecrawlService.processDocument(
        params.documentUrl,
        documentType,
        params.clientId,
        params.agentName,
        params.documentId
      );
      
      if (!response.success) {
        throw new Error(response.error || "Failed to process document");
      }
      
      // Success message based on document type
      if (documentType === "google_drive_folder") {
        toast.success("Google Drive folder documents processed successfully!");
      } else {
        toast.success("Document processed successfully!");
      }
      
      return response.data;
    } catch (error) {
      console.error("Error in processDocument:", error);
      toast.error(`Failed to process document: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processDocument,
    isProcessing
  };
}
