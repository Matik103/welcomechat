
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DOCUMENTS_BUCKET } from "@/utils/supabaseStorage";

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
        
        // Log document storage to console instead of database
        console.log(`[DOCUMENT STORED]: ${title}`, {
          clientId,
          url,
          title,
          agentName,
          documentType: type,
          size: size || 0,
          bucket: DOCUMENTS_BUCKET,
          agentId: data?.[0]?.id || null,
          agentUrl: agentData?.url || null,
          agentCreated: agentData?.created_at || null,
          documentStatus: "active"
        });
        
        const docInfo = data[0];
        console.log("Document content stored successfully with ID:", docInfo?.id);
        
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
