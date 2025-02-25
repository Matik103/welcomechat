
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
  accepted_at?: string;
  created_by?: string;
}

interface CreateInvitationData {
  email: string;
  client_id?: string;
  role_type: 'client' | 'admin';
}

export function useInvitations(clientId?: string) {
  const queryClient = useQueryClient();

  // Check if the current user has permission to manage invitations
  const { data: hasPermission, isLoading: isCheckingPermission } = useQuery({
    queryKey: ["userPermissions"],
    queryFn: async () => {
      // First, get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        return false;
      }

      // Check if user has admin or manager role using RPC
      const { data, error } = await supabase
        .rpc('check_user_role', {
          allowed_roles: ['admin', 'manager']
        });

      if (error) {
        console.error("Error checking user role:", error);
        return false;
      }

      console.log("User has permission:", data);
      return data;
    },
  });

  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["invitations", clientId],
    queryFn: async () => {
      if (!hasPermission) {
        console.log("User doesn't have permission to view invitations");
        return [];
      }

      const { data, error } = await supabase
        .from("client_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invitations:", error);
        throw error;
      }

      return data as Invitation[];
    },
    enabled: !isCheckingPermission && hasPermission === true,
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, client_id, role_type }: CreateInvitationData) => {
      if (!hasPermission) {
        throw new Error('You do not have permission to send invitations');
      }

      const token = uuidv4();
      const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from("client_invitations")
        .insert({
          email,
          client_id,
          token,
          expires_at,
          role_type,
          status: 'pending',
          created_by: currentUser.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Invitation creation error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      console.error('Create invitation error:', error);
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!hasPermission) {
        throw new Error('You do not have permission to cancel invitations');
      }

      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "expired" })
        .eq("id", invitationId)
        .select()
        .single();

      if (error) {
        console.error('Cancel invitation error:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: any) => {
      console.error('Cancel invitation error:', error);
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });

  const isLoading = isCheckingPermission || isLoadingInvitations;

  return {
    invitations,
    isLoading,
    createInvitation,
    cancelInvitation,
    isAdmin: hasPermission // Keep the same prop name for backward compatibility
  };
}
