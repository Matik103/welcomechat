
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Check if email exists in clients table
 * This function is kept for backward compatibility but simplified
 */
export const isClientInDatabase = async (email: string): Promise<boolean> => {
  // Simplified to always return false - skipping client check
  return false;
};

/**
 * Handles role determination for authenticated users
 * Simplified to always return admin role
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  // All authenticated users are now admins
  return 'admin';
};

/**
 * Force redirect based on user role
 */
export const forceRedirectBasedOnRole = (role: UserRole) => {
  console.log(`Force redirecting to admin dashboard`);
  
  // Use direct window location change for clean redirect
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
