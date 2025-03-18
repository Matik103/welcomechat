
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreContentResult {
  success: boolean;
  aiAgentId?: string;
  error?: string;
}

export function useStoreWebsiteContent() {
  const [isStoring, setIsStoring] = useState(false);

  const storeWebsiteContent = async (
    clientId: string,
    agentName: string,
    url: string,
    content: string
  ): Promise<StoreContentResult> => {
    setIsStoring(true);
    
    try {
      console.log(`Storing website content for client: ${clientId}, agent: ${agentName}`);
      
      if (!agentName || agentName.trim() === "") {
        return {
          success: false,
          error: "Agent name is not configured. Please set up an AI Agent Name in client settings before uploading content."
        };
      }
      
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          error: "No content to store"
        };
      }
      
      // Prepare metadata
      const metadata = {
        source: "website",
        url: url,
        imported_at: new Date().toISOString(),
        content_type: "text"
      };
      
      // Insert the content into AI agents table using exact agent name as provided
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName, // Use exact name without modification
          content: content,
          url: url,
          interaction_type: "imported_content",
          settings: metadata,
          is_error: false
        })
        .select("id")
        .single();
      
      if (error) {
        console.error("Error storing website content:", error);
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
      console.error("Error in storeWebsiteContent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      setIsStoring(false);
    }
  };

  return {
    storeWebsiteContent,
    isStoring
  };
}
