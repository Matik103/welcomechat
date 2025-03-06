import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClientActivity } from "./useClientActivity";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // If in client view but no ID is passed, use the client ID from user metadata
  const clientId = id || user?.user_metadata?.client_id;
  const { validateUrl, validateGoogleDriveLink, checkForEmbeddedDriveLinks } = useClientActivity(clientId);
  
  const { client, isLoadingClient, error } = useClient(clientId);
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation } = useClientInvitation();

  const addWebsiteUrl = async (url: string, refresh_rate: number) => {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Validate URL
    const isValid = await validateUrl(url);
    if (!isValid) {
      toast.error("URL is not accessible. Please check the URL and try again.");
      return;
    }

    // Check for embedded Google Drive links
    const embeddedDriveLinks = await checkForEmbeddedDriveLinks(url);
    
    // Add the website URL
    const { error: urlError } = await supabase
      .from("website_urls")
      .insert({ 
        client_id: clientId, 
        url, 
        refresh_rate 
      });

    if (urlError) throw urlError;

    // Add any found Google Drive links
    if (embeddedDriveLinks.length > 0) {
      for (const driveLink of embeddedDriveLinks) {
        // Validate each drive link
        const isDriveValid = await validateGoogleDriveLink(driveLink);
        if (isDriveValid) {
          try {
            await supabase
              .from("google_drive_links")
              .insert({ 
                client_id: clientId, 
                link: driveLink,
                refresh_rate: 30 // Default 30 days for embedded links
              });
          } catch (error) {
            console.error("Error adding embedded drive link:", error);
          }
        }
      }
    }

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
  };

  const addDriveLink = async (link: string, refresh_rate: number) => {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Validate drive link
    const isValid = await validateGoogleDriveLink(link);
    if (!isValid) {
      toast.error("Google Drive link is not publicly accessible. Please check the sharing settings and try again.");
      return;
    }

    const { error } = await supabase
      .from("google_drive_links")
      .insert({ 
        client_id: clientId, 
        link, 
        refresh_rate 
      });

    if (error) throw error;

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
  };

  const deleteDriveLink = async (id: number) => {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const { error } = await supabase
      .from("google_drive_links")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
  };

  const deleteWebsiteUrl = async (id: number) => {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const { error } = await supabase
      .from("website_urls")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
  };

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    addWebsiteUrl,
    addDriveLink,
    deleteDriveLink,
    deleteWebsiteUrl,
    clientId
  };
};
