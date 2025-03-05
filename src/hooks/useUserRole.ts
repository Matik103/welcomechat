
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'client';

export const useUserRole = () => {
  const checkUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      console.log("Checking user role for user ID:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      // If user has client_id in user_roles, update user metadata
      if (data?.client_id && data.role === 'client') {
        console.log("Found client role with client_id:", data.client_id);
        await supabase.auth.updateUser({
          data: { client_id: data.client_id }
        });
      }

      console.log("User role determined:", data?.role || "no role found");
      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  return { checkUserRole };
};
