
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Creates a role for a user in the database
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

/**
 * Force redirect to admin dashboard, bypassing React Router
 * This provides a faster and more reliable redirect for SSO flows
 */
export const forceRedirectToDashboard = () => {
  console.log("Force redirecting to admin dashboard");
  window.location.href = '/';
};

/**
 * Handles a Google authenticated user
 * Creates admin role and returns 'admin'
 */
export const handleGoogleUser = async (currentUser: User): Promise<UserRole> => {
  if (!currentUser) {
    console.error("handleGoogleUser called with no user");
    throw new Error("No user provided");
  }
  
  console.log("Handling Google user:", currentUser.email);
  
  // Always assign admin role, with no additional checks
  try {
    await createUserRole(currentUser.id, 'admin');
  } catch (error) {
    console.error("Failed to create admin role, but continuing:", error);
  }
  
  return 'admin';
};
