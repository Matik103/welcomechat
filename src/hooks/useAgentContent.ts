
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

export interface AgentSource {
  url?: string;
  settings?: Record<string, any>;
}

export function useAgentContent(clientId: string | undefined, agentName: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);

  // Query to fetch AI agent content
  const { data: agentContent, isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ["agent-content", clientId, agentName],
    queryFn: async () => {
      if (!clientId || !agentName) return null;
      
      console.log(`Fetching agent content for client: ${clientId}, agent: ${agentName}`);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      setIsLoading(true);
      
      try {
        // Get the most recent content from the agent
        const { data, error } = await supabase
          .from("ai_agents")
          .select("content, url, settings")
          .eq("client_id", clientId)
          .eq("name", agentName)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Error fetching AI agent content:", error);
          throw error;
        }
        
        console.log("Agent content fetched:", data);
        
        // Combine all content to provide context
        const combinedContent = data
          ?.filter(item => item.content && item.content.trim().length > 0)
          ?.map(item => item.content)
          ?.join("\n\n");
        
        return {
          content: combinedContent || "No content available for this agent yet.",
          sources: data?.map(item => ({
            url: item.url,
            settings: item.settings
          })) || []
        };
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!clientId && !!agentName,
  });

  // Handle error
  useEffect(() => {
    if (error) {
      console.error("Error in useAgentContent:", error);
      toast.error("Failed to load agent content");
    }
  }, [error]);

  return {
    agentContent: agentContent?.content || "",
    sources: agentContent?.sources || [],
    isLoading: isLoading || isQueryLoading,
    refetch
  };
}
