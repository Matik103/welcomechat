
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Simply returns admin role for all authenticated users
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  return 'admin';
};

/**
 * Redirects to home (admin dashboard)
 */
export const forceRedirectBasedOnRole = () => {
  window.location.href = '/';
};

/**
 * Creates a user role in the database
 */
export const createUserRole = async (
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role
      });
      
    if (error) {
      console.error("Error creating user role:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error in createUserRole:", err);
    return false;
  }
};
