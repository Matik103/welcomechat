
import { useState } from "react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useDocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Function to get the agent name for a client
  const getAgentName = async (clientId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("agent_name")
        .eq("id", clientId)
        .single();
        
      if (error) {
        console.error("Error fetching agent name:", error);
        return null;
      }
      
      return data?.agent_name || null;
    } catch (error) {
      console.error("Error in getAgentName:", error);
      return null;
    }
  };
  
  const processWebsiteUrl = async (clientId: string, url: string, urlId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const agentName = await getAgentName(clientId);
      
      if (!agentName) {
        toast.error("AI Agent Name not found. Please configure your agent name in settings.");
        return;
      }
      
      console.log(`Processing website URL for client ${clientId} with agent ${agentName}`);
      
      const result = await FirecrawlService.processDocument(
        url,
        "website_url",
        clientId,
        agentName,
        urlId.toString()
      );
      
      if (result.success) {
        toast.success("Website is being processed and will be added to your knowledge base");
      } else {
        toast.error(`Failed to process website: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error processing website URL:", error);
      toast.error(`Error processing website: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processGoogleDriveLink = async (clientId: string, link: string, linkId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const agentName = await getAgentName(clientId);
      
      if (!agentName) {
        toast.error("AI Agent Name not found. Please configure your agent name in settings.");
        return;
      }
      
      console.log(`Processing Google Drive link for client ${clientId} with agent ${agentName}`);
      
      const result = await FirecrawlService.processDocument(
        link,
        "google_drive",
        clientId,
        agentName,
        linkId.toString()
      );
      
      if (result.success) {
        toast.success("Document is being processed and will be added to your knowledge base");
      } else {
        toast.error(`Failed to process document: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error processing Google Drive link:", error);
      toast.error(`Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processUploadedDocument = async (clientId: string, file: File, documentId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const agentName = await getAgentName(clientId);
      
      if (!agentName) {
        toast.error("AI Agent Name not found. Please configure your agent name in settings.");
        return;
      }
      
      const documentUrl = `https://storage.example.com/${clientId}/${file.name}`; // This would be the actual storage URL
      
      console.log(`Processing uploaded document for client ${clientId} with agent ${agentName}`);
      
      const result = await FirecrawlService.processDocument(
        documentUrl,
        file.type,
        clientId,
        agentName,
        documentId
      );
      
      if (result.success) {
        toast.success("Document is being processed and will be added to your knowledge base");
      } else {
        toast.error(`Failed to process document: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error("Error processing uploaded document:", error);
      toast.error(`Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processWebsiteUrl,
    processGoogleDriveLink,
    processUploadedDocument,
    isProcessing
  };
}
