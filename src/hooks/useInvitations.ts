
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";

interface Invitation {
  id: string;
  email: string;
  token: string;
  role_type: 'admin' | 'client';
  status: 'pending' | 'accepted' | 'expired';
  created_by: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

interface CreateInvitationData {
  email: string;
  role_type: 'admin' | 'client';
}

export function useInvitations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if user is admin
  const { data: isAdmin, isLoading: isCheckingPermission } = useQuery({
    queryKey: ["userPermissions"],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .rpc('check_user_role', {
          allowed_roles: ['admin']
        });
      
      if (error) {
        console.error("Error checking user role:", error);
        return false;
      }

      return data;
    }
  });

  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !isCheckingPermission && isAdmin === true
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, role_type }: CreateInvitationData) => {
      if (!user) throw new Error('Not authenticated');

      const token = uuidv4();
      const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email,
          token,
          role_type,
          created_by: user.id,
          expires_at
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      console.error('Error creating invitation:', error);
      toast.error(error.message || "Failed to send invitation");
    }
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled successfully");
    },
    onError: (error: any) => {
      console.error('Error cancelling invitation:', error);
      toast.error(error.message || "Failed to cancel invitation");
    }
  });

  return {
    invitations,
    isLoading: isCheckingPermission || isLoadingInvitations,
    createInvitation,
    cancelInvitation,
    isAdmin
  };
}
