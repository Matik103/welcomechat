
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreDocumentResult {
  success: boolean;
  aiAgentId?: string;
  error?: string;
}

export function useStoreDocumentContent() {
  const [isStoring, setIsStoring] = useState(false);

  const storeDocumentContent = async (
    clientId: string,
    agentName: string,
    file: File,
    fileUrl: string
  ): Promise<StoreDocumentResult> => {
    setIsStoring(true);
    
    try {
      console.log(`Storing document content for client: ${clientId}, agent: ${agentName}`);
      
      if (!agentName || agentName.trim() === "") {
        return {
          success: false,
          error: "Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents."
        };
      }
      
      // Format agent name to include " Assistant" suffix
      const formattedAgentName = agentName.endsWith(' Assistant') 
        ? agentName 
        : `${agentName} Assistant`;
      
      // Prepare metadata
      const metadata = {
        source: "file_upload",
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        url: fileUrl
      };
      
      // Insert the content into AI agents table
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: formattedAgentName,
          content: `File uploaded: ${file.name}`,
          url: fileUrl,
          interaction_type: "file_upload",
          settings: metadata,
          is_error: false
        })
        .select("id")
        .single();
      
      if (error) {
        console.error("Error storing document content:", error);
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        aiAgentId: data.id
      };
    } catch (error) {
      console.error("Error in storeDocumentContent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      setIsStoring(false);
    }
  };

  return {
    storeDocumentContent,
    isStoring
  };
}
