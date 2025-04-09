
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WebsiteUrl, WebsiteUrlFormData } from "@/types/website-url";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWebsiteContent } from "@/utils/websiteContentFetcher";

export function useWebsiteUrlsMutation(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addWebsiteUrlMutation = useMutation({
    mutationFn: async (input: WebsiteUrlFormData): Promise<WebsiteUrl> => {
      if (!clientId && !input.client_id) {
        console.error("Client ID is missing");
        throw new Error("Client ID is required");
      }
      
      const effectiveClientId = input.client_id || clientId;
      
      console.log("Adding website URL with client ID:", effectiveClientId);
      console.log("Input data:", input);
      
      // Find the correct client record in ai_agents table
      const { data: clientRecord, error: clientError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("interaction_type", "config")
        .or(`id.eq.${effectiveClientId},client_id.eq.${effectiveClientId}`)
        .single();
          
      if (clientError) {
        console.error("Error finding client:", clientError);
        console.log("Attempting to use the provided clientId directly");
        
        // Insert the website URL with the provided client ID as fallback
        const { data, error } = await supabase
          .from("website_urls")
          .insert({
            client_id: effectiveClientId,
            url: input.url,
            refresh_rate: input.refresh_rate || 30,
            status: 'processing',
            metadata: input.metadata || {}
          })
          .select()
          .single();
            
        if (error) {
          console.error("Error inserting website URL:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("Failed to create website URL - no data returned");
        }
        
        // Fetch website content
        await processWebsiteContent(data.id, input.url, effectiveClientId);
        
        return data as WebsiteUrl;
      }
      
      console.log("Found client record:", clientRecord);
      
      // Insert the website URL with the correct client ID
      const { data, error } = await supabase
        .from("website_urls")
        .insert({
          client_id: clientRecord.id,
          url: input.url,
          refresh_rate: input.refresh_rate || 30,
          status: 'processing',
          metadata: input.metadata || {}
        })
        .select()
        .single();
          
      if (error) {
        console.error("Error inserting website URL:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create website URL - no data returned");
      }
      
      // Fetch website content
      await processWebsiteContent(data.id, input.url, clientRecord.id);
      
      return data as WebsiteUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error adding website URL: ${error.message}`);
    }
  });

  const deleteWebsiteUrlMutation = useMutation({
    mutationFn: async (urlId: number): Promise<number> => {
      try {
        const { error } = await supabase
          .from("website_urls")
          .delete()
          .eq("id", urlId);
          
        if (error) {
          console.error("Error deleting website URL:", error);
          throw error;
        }
        
        return urlId;
      } catch (error) {
        console.error("Error deleting website URL:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      toast.success("Website URL removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error removing website URL: ${error.message}`);
    }
  });

  /**
   * Process website content - fetch content and save it to the database
   */
  const processWebsiteContent = async (websiteUrlId: number, url: string, clientId: string): Promise<void> => {
    try {
      // Generate a unique document ID for tracking
      const documentId = crypto.randomUUID();

      // Create document processing job entry
      const { data: jobData, error: jobError } = await supabase
        .from("document_processing_jobs")
        .insert({
          client_id: clientId,
          agent_name: "URL Content Processor",
          document_id: documentId,
          document_url: url,
          document_type: "website",
          status: "processing",
          metadata: {
            website_url_id: websiteUrlId,
            processing_start: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (jobError) {
        console.error("Error creating document processing job:", jobError);
        throw jobError;
      }

      // Fetch the content as markdown
      console.log("Fetching content for website:", url);
      const { content, success, error } = await fetchWebsiteContent(url);

      if (!success || !content) {
        throw new Error(error || "Failed to fetch website content");
      }

      // Save content to document_processing_jobs
      const { error: updateJobError } = await supabase
        .from("document_processing_jobs")
        .update({
          status: "completed", 
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq("id", jobData.id);

      if (updateJobError) {
        console.error("Error updating document processing job:", updateJobError);
        throw updateJobError;
      }

      // Save content to ai_agents
      const { error: aiAgentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: `Website: ${url}`,
          content: content,
          interaction_type: "website_content",
          metadata: {
            source_url: url,
            website_url_id: websiteUrlId,
            document_id: documentId,
            imported_at: new Date().toISOString()
          }
        });

      if (aiAgentError) {
        console.error("Error saving content to ai_agents:", aiAgentError);
        throw aiAgentError;
      }

      // Update website_url status to completed
      const { error: updateUrlError } = await supabase
        .from("website_urls")
        .update({ 
          status: "completed",
          last_crawled: new Date().toISOString()
        })
        .eq("id", websiteUrlId);

      if (updateUrlError) {
        console.error("Error updating website URL status:", updateUrlError);
        throw updateUrlError;
      }

      console.log("Successfully processed website content:", url);
    } catch (error) {
      console.error("Error processing website content:", error);
      
      // Update website_url status to failed
      await supabase
        .from("website_urls")
        .update({ 
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          last_crawled: new Date().toISOString()
        })
        .eq("id", websiteUrlId);
        
      // Update document processing job status if exists
      await supabase
        .from("document_processing_jobs")
        .update({ 
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString()
        })
        .eq("document_url", url)
        .eq("client_id", clientId);
      
      throw error;
    }
  };

  return {
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    addWebsiteUrl: addWebsiteUrlMutation.mutateAsync,
    deleteWebsiteUrl: deleteWebsiteUrlMutation.mutateAsync,
  };
}
