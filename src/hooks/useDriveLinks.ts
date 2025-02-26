
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink } from "@/types/client";

interface AIAgentMetadata {
  client_id: string;
  url: string;
  type?: string;
}

interface AIAgentEntry {
  id: number;
  content: string | null;
  embedding: string | null;
  metadata: AIAgentMetadata | null;
}

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

  const checkDriveLinkAccess = async (link: string) => {
    try {
      // Extract file/folder ID from Google Drive link
      const matches = link.match(/[-\w]{25,}/);
      if (!matches) {
        throw new Error("Invalid Google Drive link format");
      }
      
      // Check if the URL exists in the AI agent table
      const { data: existingData } = await supabase
        .from("ai_agent")
        .select<"*", AIAgentEntry>("*")
        .eq("metadata->client_id", clientId)
        .eq("metadata->url", link)
        .single();

      if (existingData) {
        // Delete the old content
        await supabase
          .from("ai_agent")
          .delete()
          .eq("metadata->client_id", clientId)
          .eq("metadata->url", link);
      }

      // Attempt to fetch the metadata to check if it's public
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${matches[0]}?fields=capabilities&key=${process.env.GOOGLE_API_KEY}`);
      
      if (!response.ok) {
        throw new Error("Drive file is not publicly accessible");
      }

      // Trigger n8n webhook for processing
      await fetch(process.env.N8N_WEBHOOK_URL || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          url: link,
          type: "google_drive"
        })
      });

      return true;
    } catch (error) {
      // Log error to error_logs table
      await supabase.from("error_logs").insert({
        client_id: clientId,
        error_type: "drive_link_access",
        message: error.message,
        status: "error"
      });
      
      throw error;
    }
  };

  const addDriveLinkMutation = useMutation({
    mutationFn: async ({ link, refresh_rate }: { link: string; refresh_rate: number }) => {
      if (!clientId) throw new Error("Client ID is required");
      
      // Validate drive link accessibility
      await checkDriveLinkAccess(link);
      
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
