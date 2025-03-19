
import { useState } from "react";
import { toast } from "sonner";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { LlamaCloudService } from "@/utils/LlamaCloudService";
import { trackDocumentProcessing } from "@/services/documentProcessingService";

interface ProcessDocumentParams {
  documentUrl: string;
  documentType: string;
  clientId: string;
  agentName: string;
  documentId: string;
}

export function useDocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  const processDocument = async (params: ProcessDocumentParams) => {
    const { documentUrl, documentType, clientId, agentName, documentId } = params;
    
    setIsProcessing(true);
    
    try {
      // Track document processing start
      await trackDocumentProcessing(
        clientId,
        agentName,
        documentId,
        'started',
        {
          name: documentUrl,
          type: documentType,
          url: documentUrl
        }
      );
      
      // Determine which service to use based on document type
      // Website URLs always use Firecrawl, everything else uses LlamaParse
      let response;
      if (documentType === "website_url" || documentType.includes("website")) {
        console.log(`Processing website URL with Firecrawl: ${documentUrl}`);
        response = await FirecrawlService.processDocument(
          documentUrl,
          documentType,
          clientId,
          agentName,
          documentId,
          false // Don't use LlamaParse for websites
        );
      } else {
        console.log(`Processing document with LlamaParse: ${documentUrl}`);
        response = await LlamaCloudService.parseDocument(
          documentUrl,
          documentType
        );
      }
      
      console.log("Document processing response:", response);
      
      if (!response.success) {
        // Track document processing failure
        await trackDocumentProcessing(
          clientId,
          agentName,
          documentId,
          'failed',
          {
            name: documentUrl,
            type: documentType,
            url: documentUrl
          },
          response.error || "Unknown error"
        );
        
        toast.error(`Failed to process document: ${response.error || "Unknown error"}`);
        return;
      }
      
      // If job ID is returned, store it
      if (response.data?.job_id) {
        setLastJobId(response.data.job_id);
      }
      
      // Track document processing completion
      // Fix: Add only the properties that exist in the type signature
      // Remove content_length property that's not in the type
      await trackDocumentProcessing(
        clientId,
        agentName,
        documentId,
        'completed',
        {
          name: documentUrl,
          type: documentType,
          url: documentUrl,
          // The content_length property is removed as it's not part of the expected type
          size: response.data?.content_length || 0 // Use size instead for tracking content length
        }
      );
      
      toast.success(`Document processed successfully!`);
      
      return response.data;
    } catch (error) {
      console.error("Error processing document:", error);
      
      // Track document processing failure
      await trackDocumentProcessing(
        clientId,
        agentName,
        documentId,
        'failed',
        {
          name: documentUrl,
          type: documentType,
          url: documentUrl
        },
        error instanceof Error ? error.message : "Unknown error"
      );
      
      toast.error(`Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocument,
    isProcessing,
    lastJobId
  };
}
