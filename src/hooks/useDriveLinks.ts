
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink } from "@/types/client";

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["driveLinks", clientId],
    queryFn: async () => {
      if (!clientId) {
        console.log("No client ID provided for driveLinks query, returning empty array");
        return [];
      }
      
      console.log("Fetching drive links for client:", clientId);
      try {
        const { data, error } = await supabase
          .from("google_drive_links")
          .select("*")
          .eq("client_id", clientId);
          
        if (error) {
          console.error("Error fetching drive links:", error);
          throw error;
        }
        
        console.log("Fetched drive links:", data);
        return data as DriveLink[];
      } catch (error) {
        console.error("Exception in driveLinks query:", error);
        throw error;
      }
    },
    enabled: !!clientId,
  });

  const addDriveLink = async (input: { link: string; refresh_rate: number; client_id?: string }): Promise<DriveLink> => {
    // Ensure we have a client ID, either from the input or the hook parameter
    const effectiveClientId = input.client_id || clientId;
    
    if (!effectiveClientId) {
      console.error("Client ID is missing");
      toast.error("Unable to add Google Drive link: Client ID is missing. Please refresh the page or contact support.");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding drive link with client ID:", effectiveClientId);
    console.log("Input data:", input);
    
    // Insert the drive link
    try {
      const { data, error } = await supabase
        .from("google_drive_links")
        .insert({
          client_id: effectiveClientId,
          link: input.link,
          refresh_rate: input.refresh_rate,
        })
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error adding drive link:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create drive link - no data returned");
      }
      
      console.log("Successfully added drive link:", data);
      return data as DriveLink;
    } catch (insertError) {
      console.error("Error inserting drive link:", insertError);
      throw insertError;
    }
  };

  const deleteDriveLink = async (linkId: number): Promise<number> => {
    console.log("Deleting drive link with ID:", linkId);
    try {
      const { error } = await supabase
        .from("google_drive_links")
        .delete()
        .eq("id", linkId);
        
      if (error) {
        console.error("Error deleting drive link:", error);
        throw error;
      }
      
      console.log("Successfully deleted drive link:", linkId);
      return linkId;
    } catch (deleteError) {
      console.error("Exception in deleteDriveLink:", deleteError);
      throw deleteError;
    }
  };

  const addDriveLinkMutation = useMutation({
    mutationFn: addDriveLink,
    onSuccess: () => {
      console.log("Drive link added successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      toast.success("Google Drive link added successfully");
    },
    onError: (error: Error) => {
      console.error("Drive link mutation error:", error);
      toast.error(`Error adding Google Drive link: ${error.message}`);
    }
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: deleteDriveLink,
    onSuccess: () => {
      console.log("Drive link deleted successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      toast.success("Google Drive link removed successfully");
    },
    onError: (error: Error) => {
      console.error("Drive link deletion error:", error);
      toast.error(`Error removing Google Drive link: ${error.message}`);
    }
  });

  return {
    driveLinks: query.data || [],
    refetchDriveLinks: query.refetch,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
    isLoading: query.isLoading,
    isError: query.isError
  };
}
