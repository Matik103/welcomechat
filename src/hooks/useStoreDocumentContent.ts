
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreDocumentResult {
  success: boolean;
  aiAgentId?: string;
  error?: string;
}

export function useStoreDocumentContent() {
  const [isStoring, setIsStoring] = useState(false);

  // Function to get the latest agent name for a client
  const getAgentName = async (clientId: string): Promise<string | null> => {
    try {
      console.log(`Fetching agent name for client: ${clientId}`);
      
      // First try to get the agent name from clients table
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("agent_name")
        .eq("id", clientId)
        .single();

      if (clientError) {
        console.error("Error fetching agent name from clients table:", clientError);
        
        // If that fails, try to get the latest agent name from ai_agents
        const { data: agentsData, error: agentsError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("client_id", clientId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (agentsError || !agentsData || agentsData.length === 0) {
          console.error("Error fetching agent name from ai_agents:", agentsError);
          return null;
        }
        
        return agentsData[0]?.name || null;
      }

      return clientData?.agent_name || null;
    } catch (error) {
      console.error("Error in getAgentName:", error);
      return null;
    }
  };

  const storeDocumentContent = async (
    clientId: string,
    agentName: string | null,
    file: File,
    fileUrl: string
  ): Promise<StoreDocumentResult> => {
    setIsStoring(true);
    
    try {
      // Fetch the latest agent name from the database if not provided
      const validAgentName = agentName || await getAgentName(clientId);
      console.log(`Storing document content for client: ${clientId}, agent: ${validAgentName}`);
      
      if (!validAgentName || validAgentName.trim() === "") {
        return {
          success: false,
          error: "Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents."
        };
      }
      
      // Prepare metadata
      const metadata = {
        source: "file_upload",
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        url: fileUrl
      };
      
      // Insert the content into AI agents table using exact agent name as provided
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: validAgentName, // Use the valid agent name
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
