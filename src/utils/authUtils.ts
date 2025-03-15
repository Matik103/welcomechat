import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Determines user role by checking if they exist in the clients table
 * or if they're using Google SSO (which is always admin)
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  if (!user?.email) return 'admin';
  
  // Check if the user is using Google SSO
  const isGoogleUser = user.app_metadata?.provider === 'google';
  if (isGoogleUser) {
    console.log("User authenticated with Google SSO - assigning admin role");
    return 'admin';
  }
  
  // Otherwise check if they're a client in the database
  const isClient = await isClientInDatabase(user.email);
  return isClient ? 'client' : 'admin';
};

/**
 * Redirects the user based on their role
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

/**
 * Check if email exists in clients table
 */
export const isClientInDatabase = async (email: string): Promise<boolean> => {
  try {
    if (!email) return false;
    
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking client email:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error in isClientInDatabase:", err);
    return false;
  }
};
