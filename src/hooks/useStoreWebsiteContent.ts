
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
      
      // Normalize URL
      let normalizedUrl = url;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      // Prepare metadata with more detailed information
      const metadata = {
        source: "website",
        url: normalizedUrl,
        imported_at: new Date().toISOString(),
        content_type: "text",
        extraction_method: "direct", // Direct method vs Firecrawl
        content_length: content.length,
        title: extractTitleFromContent(content) || normalizedUrl
      };
      
      // Insert the content into AI agents table using exact agent name as provided
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName, // Use exact name without modification
          content: content,
          url: normalizedUrl,
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

  // Helper function to extract title from HTML content
  const extractTitleFromContent = (content: string): string | null => {
    try {
      // Try to extract title from HTML content
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
      
      // Try to extract first heading
      const headingMatch = content.match(/<h1>(.*?)<\/h1>/i);
      if (headingMatch && headingMatch[1]) {
        return headingMatch[1].trim();
      }
      
      return null;
    } catch (error) {
      console.error("Error extracting title:", error);
      return null;
    }
  };

  return {
    storeWebsiteContent,
    isStoring
  };
}
