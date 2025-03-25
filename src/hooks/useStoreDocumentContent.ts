
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LlamaCloudService } from "@/utils/LlamaCloudService";

interface StoreDocumentResult {
  success: boolean;
  message: string;
  id?: string;
}

export function useStoreDocumentContent(clientId: string, agentName: string) {
  const [isStoring, setIsStoring] = useState(false);

  const storeMutation = useMutation({
    mutationFn: async (documentData: {
      content: string;
      url: string;
      title: string;
      type: string;
      size?: number;
    }): Promise<StoreDocumentResult> => {
      try {
        setIsStoring(true);
        
        const { content, url, title, type, size } = documentData;
        
        if (!content) {
          return {
            success: false,
            message: "No content provided for storing"
          };
        }
        
        console.log(`Storing document "${title}" (${size || 0} bytes) from ${url} for client ${clientId}`);
        
        // Extract domain from the URL for metadata
        let domain = '';
        try {
          domain = new URL(url).hostname;
        } catch (e) {
          console.log("Not a valid URL, using as-is");
          domain = url;
        }
        
        // Create a new record in the ai_agents table with the document content
        const { data, error } = await supabase
          .from("ai_agents")
          .insert({
            client_id: clientId,
            name: agentName,
            content: content,
            url: url,
            interaction_type: "document",
            settings: {
              title: title,
              domain: domain,
              source_url: url,
              document_type: type,
              size: size || 0,
              stored_at: new Date().toISOString()
            },
            status: "active",
            type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          console.error("Error storing document content:", error);
          return {
            success: false,
            message: `Error storing document: ${error.message}`
          };
        }
        
        // Get the document agent record for logging
        const { data: agentData } = await supabase
          .from("ai_agents")
          .select("name, settings, url, created_at")
          .eq("client_id", clientId)
          .eq("name", agentName)
          .eq("interaction_type", "config")
          .single();
        
        // Log activity of document storage
        const docInfo = data[0];
        
        // Use typecast for activity_type
        await supabase
          .from("client_activities")
          .insert({
            client_id: clientId,
            activity_type: "document_stored" as any,
            description: `Stored document content: ${title}`,
            metadata: {
              url: url,
              title: title,
              agent_name: agentName,
              document_type: type,
              size: size || 0,
              // Safe access for agentData properties
              agent_id: docInfo?.id || null,
              agent_url: agentData?.url || null,
              agent_created: agentData?.created_at || null,
              document_status: "active"
            }
          });
        
        console.log("Document content stored successfully with ID:", docInfo?.id);
        
        // Now that we've stored the document, initiate the LlamaParse processing
        // This is an asynchronous operation that will update the content later
        if (type !== 'text') {
          // For non-text documents, use LlamaParse for better extraction
          try {
            const parseResponse = await LlamaCloudService.parseDocument(url, type, clientId, agentName);
            if ('success' in parseResponse && parseResponse.success) {
              console.log("Document processing initiated successfully");
              // The edge function will update the content asynchronously
            } else {
              const errorMsg = 'error' in parseResponse ? parseResponse.error : 'Unknown error';
              console.error("Failed to initiate document processing:", errorMsg);
              toast.error("Document uploaded, but processing failed to start. Please try again later.");
            }
          } catch (err) {
            console.error("Error initiating document processing:", err);
          }
        }
        
        return {
          success: true,
          message: "Document content stored successfully",
          id: docInfo?.id
        };
      } catch (err: any) {
        console.error("Error in storeDocumentContent:", err);
        return {
          success: false,
          message: `Failed to store document: ${err.message}`
        };
      } finally {
        setIsStoring(false);
      }
    }
  });

  return {
    storeDocumentContent: storeMutation.mutate,
    isStoring: isStoring || storeMutation.isPending,
    error: storeMutation.error
  };
}
