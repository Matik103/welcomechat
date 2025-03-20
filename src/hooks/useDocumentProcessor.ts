
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientActivity } from "./useClientActivity";
import { toast } from "sonner";
import { processDocumentWithLlamaParse } from "@/services/documentProcessingService";

export const useDocumentProcessor = (clientId: string) => {
  const { logClientActivity } = useClientActivity(clientId);

  const documentProcessorMutation = useMutation({
    mutationFn: async ({ file, agentName }: { file: File, agentName: string }) => {
      try {
        await logClientActivity(
          "document_uploaded",
          `Uploaded document: ${file.name}`,
          {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        );

        const result = await processDocumentWithLlamaParse(file, clientId, agentName);
        
        if (result.status === "failed") {
          toast.error(`Failed to process document: ${result.error}`);
          return { success: false, error: result.error };
        }
        
        return { 
          success: true, 
          documentId: result.documentId, 
          content: result.content?.substring(0, 100) + "..." 
        };
      } catch (error: any) {
        console.error("Error processing document:", error);
        toast.error("Failed to process document");
        return { success: false, error: error.message };
      }
    }
  });

  return {
    processDocument: documentProcessorMutation.mutate,
    isProcessing: documentProcessorMutation.isPending,
    error: documentProcessorMutation.error,
    result: documentProcessorMutation.data
  };
};
