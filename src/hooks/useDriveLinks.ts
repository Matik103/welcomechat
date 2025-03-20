
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentLink, AccessStatus } from "@/types/client";

export const useDriveLinks = (clientId: string) => {
  const queryClient = useQueryClient();

  // Query to fetch drive links
  const { data: driveLinks = [], isLoading, error, refetch } = useQuery({
    queryKey: ["driveLinks", clientId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("google_drive_links")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Convert to DocumentLink type with document_type property added
        return (data || []).map(link => ({
          ...link,
          document_type: "google_drive" // Add missing document_type property
        })) as DocumentLink[];
      } catch (error) {
        console.error("Error fetching drive links:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });

  // Mutation to add a new drive link
  const addDriveLinkMutation = useMutation({
    mutationFn: async (data: { link: string; refresh_rate: number }) => {
      const { data: result, error } = await supabase
        .from("google_drive_links")
        .insert({
          client_id: clientId,
          link: data.link,
          refresh_rate: data.refresh_rate,
          access_status: "unknown",
        })
        .select()
        .single();

      if (error) throw error;
      
      // Return with document_type for consistent typing
      return {
        ...result,
        document_type: "google_drive"
      } as DocumentLink;
    },
    onSuccess: () => {
      toast.success("Drive link added successfully");
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
    },
    onError: (error) => {
      console.error("Error adding drive link:", error);
      toast.error("Failed to add drive link");
    },
  });

  // Mutation to delete a drive link
  const deleteDriveLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from("google_drive_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
      return linkId;
    },
    onSuccess: () => {
      toast.success("Drive link deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
    },
    onError: (error) => {
      console.error("Error deleting drive link:", error);
      toast.error("Failed to delete drive link");
    },
  });

  return {
    driveLinks,
    isLoading,
    error,
    refetch,
    addDriveLink: addDriveLinkMutation.mutate,
    deleteDriveLink: deleteDriveLinkMutation.mutate,
    isAdding: addDriveLinkMutation.isPending,
    isDeleting: deleteDriveLinkMutation.isPending,
  };
};
