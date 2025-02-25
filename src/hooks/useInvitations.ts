
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
  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      console.log("Fetching user role...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        return null;
      }
      console.log("Found user:", user.id);

      // Query the user_roles table for admin or manager roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select(`
          role,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq("user_id", user.id)
        .in("role", ['admin', 'manager']);

      if (userRolesError) {
        console.error("Error fetching user role:", userRolesError);
        return null;
      }

      console.log("Roles found:", userRoles);
      const role = userRoles?.[0]?.role || null;
      console.log("Selected role:", role);
      return role;
    },
  });

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", clientId],
    queryFn: async () => {
      if (!userRole) return [];

      const { data, error } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!clientId && !!userRole,
  });

  const createInvitation = useMutation({
    mutationFn: async ({ email, client_id, role_type }: CreateInvitationData) => {
      if (!userRole || !['admin', 'manager'].includes(userRole)) {
        throw new Error('Only administrators and managers can send invitations');
      }

      const token = uuidv4();
      const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from("client_invitations")
        .insert({
          email,
          client_id,
          token,
          expires_at,
          role_type,
          status: 'pending',
          created_by: currentUser.user.id
        });

      if (error) {
        console.error('Invitation creation error:', error);
        throw new Error(error.message);
      }
      
      return token;
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
      if (!userRole || !['admin', 'manager'].includes(userRole)) {
        throw new Error('Only administrators and managers can cancel invitations');
      }

      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);

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

  // Return true if user has permission to manage invitations
  const canManageInvitations = userRole && ['admin', 'manager'].includes(userRole);
  console.log("Current user role:", userRole, "Can manage invitations:", canManageInvitations);

  return {
    invitations,
    isLoading,
    createInvitation,
    cancelInvitation,
    isAdmin: canManageInvitations // Keep the same prop name for backward compatibility
  };
}
