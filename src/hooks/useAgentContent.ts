
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

export interface AgentSource {
  url?: string;
  title?: string;
  documentType?: string;
  settings?: Record<string, any>;
}

export function useAgentContent(clientId: string | undefined, agentName: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);

  // Query to fetch AI agent content
  const { data: agentContent, isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ["agent-content", clientId, agentName],
    queryFn: async () => {
      if (!clientId) return null;
      
      console.log(`Fetching agent content for client: ${clientId}, agent: ${agentName || 'default'}`);
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      setIsLoading(true);
      
      try {
        // First, get content from document_processing_jobs table
        const { data: docData, error: docError } = await supabase
          .from("document_processing_jobs")
          .select("content, url, title, document_type, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (docError) {
          console.error("Error fetching document content:", docError);
        }
        
        // Get content from ai_agents table (documents)
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("content, url, settings, type, created_at")
          .eq("client_id", clientId)
          .eq("interaction_type", "document")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (agentError) {
          console.error("Error fetching AI agent document content:", agentError);
        }
        
        // Combine all content sources into one collection
        let allSources: { 
          content: string; 
          url?: string; 
          title?: string;
          documentType?: string;
          createdAt: string;
          source: string;
          settings?: any;
        }[] = [];
        
        // Add document_processing_jobs content
        if (docData && docData.length > 0) {
          const docSources = docData.map(doc => ({
            content: doc.content || "",
            url: doc.url,
            title: doc.title,
            documentType: doc.document_type,
            createdAt: doc.created_at,
            source: "document_processing_jobs"
          }));
          allSources = [...allSources, ...docSources];
        }
        
        // Add ai_agents document content
        if (agentData && agentData.length > 0) {
          const agentSources = agentData.map(doc => ({
            content: doc.content || "",
            url: doc.url,
            title: doc.settings?.title,
            documentType: doc.type,
            createdAt: doc.created_at,
            source: "ai_agents",
            settings: doc.settings
          }));
          allSources = [...allSources, ...agentSources];
        }
        
        // Sort all sources by created_at (newest first)
        allSources.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log(`Found ${allSources.length} content sources for client ${clientId}`);
        
        // Combine all content to provide context
        const combinedContent = allSources
          .filter(item => item.content && item.content.trim().length > 0)
          .map(item => item.content)
          .join("\n\n");
        
        // Extract source metadata for UI
        const sources = allSources.map(item => ({
          url: item.url,
          title: item.title,
          documentType: item.documentType,
          settings: item.settings
        }));
        
        return {
          content: combinedContent || "No content available for this agent yet.",
          sources
        };
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
