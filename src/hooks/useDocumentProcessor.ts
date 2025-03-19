
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProcessDocumentInput {
  documentUrl: string;
  documentType: string;
  clientId: string;
  agentName: string;
  documentId: string;
}

export function useDocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessingResult, setLastProcessingResult] = useState<any>(null);

  const processDocument = async (input: ProcessDocumentInput): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!input.documentUrl || !input.documentType || !input.clientId || !input.agentName || !input.documentId) {
      return { 
        success: false, 
        error: "Missing required fields for document processing" 
      };
    }
    
    try {
      setIsProcessing(true);
      console.log("Processing document:", input);
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: {
          documentUrl: input.documentUrl,
          documentType: input.documentType,
          clientId: input.clientId,
          agentName: input.agentName,
          documentId: input.documentId
        }
      });
      
      if (error) {
        console.error("Error calling process-document function:", error);
        toast.error(`Processing failed: ${error.message}`);
        setLastProcessingResult({ success: false, error: error.message });
        return { 
          success: false, 
          error: error.message 
        };
      }
      
      console.log("Document processing result:", data);
      setLastProcessingResult(data);
      
      if (data.success) {
        toast.success("Document processed successfully");
        return {
          success: true,
          message: data.message || "Document processed successfully"
        };
      } else {
        toast.error(`Processing failed: ${data.error}`);
        return {
          success: false,
          error: data.error
        };
      }
    } catch (error) {
      console.error("Unhandled error in processDocument:", error);
      toast.error(`Processing failed: ${error.message}`);
      setLastProcessingResult({ success: false, error: error.message });
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processDocument,
    isProcessing,
    lastProcessingResult
  };
}
