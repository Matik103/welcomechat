
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";

interface CreateInvitationData {
  email: string;
  role_type: 'admin' | 'client';
}

export function useInvitations() {
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
    }
  });

  return {
    createInvitation,
    isLoading: isCheckingPermission,
    isAdmin
  };
}
