
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Invitation {
  id: string;
  email: string;
  client_id: string | null;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  token: string;
  role_type: 'client' | 'admin';
}

interface CreateInvitationData {
  email: string;
  client_id?: string;
  role_type: 'client' | 'admin';
}

export function useInvitations(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!clientId,
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, client_id, role_type }: CreateInvitationData) => {
      const token = uuidv4();
      const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("client_invitations")
        .insert({
          email,
          client_id,
          token,
          expires_at,
          role_type,
          status: 'pending' as const
        });

      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "expired" as const })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel invitation: ${error.message}`);
    },
  });

  return {
    invitations,
    isLoading,
    createInvitation,
    cancelInvitation,
  };
}
