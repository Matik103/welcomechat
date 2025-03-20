
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/app";

/**
 * Determines the user role by checking for user privileges
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  if (!user) return 'user'; // Default fallback
  
  // Check if the user authenticated via Google SSO
  const isGoogleUser = user.app_metadata?.provider === 'google';
  
  // All Google SSO users are automatically assigned admin role
  if (isGoogleUser) {
    console.log("Google SSO user detected - assigning admin role:", user.email);
    return 'admin';
  }
  
  try {
    // For email/password users, default to user role
    console.log("User determined to be a standard user:", user.email);
    return 'user';
  } catch (err) {
    console.error("Error in determineUserRole:", err);
    return 'user'; // Default to user on error
  }
};

/**
 * Redirects to appropriate dashboard based on role
 */
export const forceRedirectBasedOnRole = (role: UserRole) => {
  if (role === 'user') {
    window.location.href = '/dashboard';
  } else {
    window.location.href = '/admin/dashboard';
  }
};

/**
 * Get dashboard route based on user role
 */
export const getDashboardRoute = (role: UserRole): string => {
  return role === 'user' ? '/dashboard' : '/admin/dashboard';
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
