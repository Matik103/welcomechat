
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink } from "@/types/client";
import { useState } from "react";

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  
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

  const validateDriveLink = async (link: string): Promise<{ success: boolean; message?: string; url?: string; error?: string }> => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-url", {
        body: {
          url: link,
          type: "drive"
        }
      });
      
      if (error) {
        console.error("Error validating drive link:", error);
        return { success: false, error: error.message };
      }
      
      console.log("Drive validation response:", data);
      return data;
    } catch (error: any) {
      console.error("Exception during drive link validation:", error);
      return { success: false, error: error.message || "Failed to validate drive link" };
    } finally {
      setIsValidating(false);
    }
  };

  const checkDriveLinkAccess = async (link: string): Promise<string> => {
    try {
      const validationResult = await validateDriveLink(link);
      
      if (!validationResult.success) {
        throw new Error(validationResult.error || "Google Drive link validation failed");
      }
      
      // Extract file ID from Google Drive link
      const validatedLink = validationResult.url || link;
      let fileId = '';
      
      // Handle different Google Drive URL formats
      if (validatedLink.includes('/file/d/')) {
        fileId = validatedLink.split('/file/d/')[1]?.split('/')[0];
      } else if (validatedLink.includes('id=')) {
        fileId = new URL(validatedLink).searchParams.get('id') || '';
      } else if (validatedLink.includes('/d/')) {
        fileId = validatedLink.split('/d/')[1]?.split('/')[0];
      }
      
      if (!fileId) {
        throw new Error("Invalid Google Drive link format - couldn't extract file ID");
      }
      
      // Check if there's already data for this URL in the AI agent table
      const { data: existingData } = await supabase
        .from('ai_agent')
        .select('id')
        .eq('metadata->>client_id', clientId)
        .eq('metadata->>url', validatedLink)
        .maybeSingle();
      
      if (existingData) {
        // Delete existing data to avoid duplicates
        await supabase
          .from('ai_agent')
          .delete()
          .eq('id', existingData.id);
      }

      return validatedLink;
    } catch (error: any) {
      // Log error to database
      if (clientId) {
        await supabase.from("error_logs").insert({
          client_id: clientId,
          error_type: "drive_link_access",
          message: error.message,
          status: "error"
        });
      }
      
      throw error;
    }
  };

  const addDriveLink = async (input: { link: string; refresh_rate: number }): Promise<DriveLink> => {
    if (!clientId) throw new Error("Client ID is required");
    
    // Validate Google Drive link accessibility
    const validatedLink = await checkDriveLinkAccess(input.link);
    
    // If validation passes, add the link to the database
    const { data, error } = await supabase
      .from("google_drive_links")
      .insert({
        client_id: clientId, 
        link: validatedLink, 
        refresh_rate: input.refresh_rate 
      })
      .select()
      .single();
      
    if (error) throw error;
    if (!data) throw new Error("Failed to create drive link");
    
    return data as DriveLink;
  };

  const deleteDriveLink = async (linkId: number): Promise<number> => {
    const { error } = await supabase
      .from("google_drive_links")
      .delete()
      .eq("id", linkId);
    if (error) throw error;
    return linkId;
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
    isError: query.isError,
    isValidating
  };
}
