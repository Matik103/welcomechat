
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink } from "@/types/client";

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["driveLinks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching drive links:", error);
        throw error;
      }
      
      return data as DriveLink[];
    },
    enabled: !!clientId,
  });

  const checkDriveLinkAccess = async (link: string): Promise<boolean> => {
    try {
      // Extract file ID from Google Drive link
      let fileId = '';
      
      // Handle different Google Drive URL formats
      if (link.includes('/file/d/')) {
        fileId = link.split('/file/d/')[1]?.split('/')[0];
      } else if (link.includes('id=')) {
        fileId = new URL(link).searchParams.get('id') || '';
      } else if (link.includes('/d/')) {
        fileId = link.split('/d/')[1]?.split('/')[0];
      }
      
      if (!fileId) {
        throw new Error("Invalid Google Drive link format - couldn't extract file ID");
      }
      
      // Check if there's already data for this URL in the AI agent table
      const { data: existingData } = await supabase
        .from('ai_agent')
        .select('id')
        .eq('metadata->>client_id', clientId)
        .eq('metadata->>url', link)
        .maybeSingle();
      
      if (existingData) {
        // Delete existing data to avoid duplicates
        await supabase
          .from('ai_agent')
          .delete()
          .eq('id', existingData.id);
      }

      // Check if the file is publicly accessible using direct file URL
      const response = await fetch(`https://drive.google.com/uc?export=view&id=${fileId}`, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Lovable/1.0; +https://lovable.dev)"
        }
      });
      
      if (response.status !== 200) {
        throw new Error("Google Drive file is not publicly accessible");
      }

      return true;
    } catch (error: any) {
      // Log error to database
      await supabase.from("error_logs").insert({
        client_id: clientId,
        error_type: "drive_link_access",
        message: error.message,
        status: "error"
      });
      
      throw error;
    }
  };

  const addDriveLink = async (input: { link: string; refresh_rate: number }): Promise<DriveLink> => {
    if (!clientId) throw new Error("Client ID is required");
    
    // Validate Google Drive link accessibility
    await checkDriveLinkAccess(input.link);
    
    // If validation passes, add the link to the database
    const { data, error } = await supabase
      .from("google_drive_links")
      .insert({
        client_id: clientId, 
        link: input.link, 
        refresh_rate: input.refresh_rate 
      })
      .select()
      .single();
      
    if (error) throw error;
    if (!data) throw new Error("Failed to create drive link");
    
    return data as DriveLink;
  };

  const deleteDriveLink = async (linkId: number): Promise<void> => {
    const { error } = await supabase
      .from("google_drive_links")
      .delete()
      .eq("id", linkId);
    if (error) throw error;
  };

  const addDriveLinkMutation = useMutation({
    mutationFn: addDriveLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      toast.success("Drive link added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error adding drive link: ${error.message}`);
    }
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: deleteDriveLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      toast.success("Drive link removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error removing drive link: ${error.message}`);
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
