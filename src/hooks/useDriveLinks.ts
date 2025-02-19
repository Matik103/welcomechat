
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink } from "@/types/client";

export const useDriveLinks = (clientId: string | undefined) => {
  const { data: driveLinks = [], refetch: refetchDriveLinks } = useQuery({
    queryKey: ["driveLinks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  const addDriveLinkMutation = useMutation({
    mutationFn: async ({ link, refresh_rate }: { link: string; refresh_rate: number }) => {
      if (!clientId) throw new Error("Client ID is required");
      const { data, error } = await supabase
        .from("google_drive_links")
        .insert([{ client_id: clientId, link, refresh_rate }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchDriveLinks();
      toast.success("Drive link added successfully");
    },
    onError: (error) => {
      toast.error(`Error adding drive link: ${error.message}`);
    },
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const { error } = await supabase
        .from("google_drive_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDriveLinks();
      toast.success("Drive link removed successfully");
    },
    onError: (error) => {
      toast.error(`Error removing drive link: ${error.message}`);
    },
  });

  return {
    driveLinks,
    refetchDriveLinks,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
  };
};
