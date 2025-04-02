
import { supabase } from "@/integrations/supabase/client";

// Define UserRole type directly as string literals
type UserRole = 'admin' | 'client' | null;

/**
 * Get the current user's role
 * @returns The user's role
 */
export const getUserRole = async (): Promise<UserRole> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("No user found when checking role");
      return null;
    }
    
    // Check if this is a Google SSO user
    const isGoogleUser = user.app_metadata?.provider === 'google';
    
    // Option 1: First check user metadata (fastest)
    if (user.user_metadata && typeof user.user_metadata === 'object') {
      const role = user.user_metadata.role;
      if (role === 'admin' || role === 'client') {
        console.log("Role found in user metadata:", role);
        return role as UserRole;
      }
    }
    
    // Option 2: Check user_roles table
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!roleError && roleData && roleData.role) {
        console.log("Role found in user_roles table:", roleData.role);
        return roleData.role as UserRole;
      }
    } catch (roleErr) {
      console.error("Error checking user_roles table:", roleErr);
    }
    
    // Option 3: Check if user has a corresponding client in ai_agents
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('email', user.email)
        .eq('interaction_type', 'config')
        .maybeSingle();
      
      if (!clientError && clientData) {
        console.log("User found as client in ai_agents table");
        return 'client';
      }
    } catch (clientErr) {
      console.error("Error checking ai_agents table:", clientErr);
    }
    
    // For Google users, default to admin role
    if (isGoogleUser) {
      console.log("Google user with no explicit role, defaulting to admin");
      return 'admin';
    }
    
    // Default to admin as a fallback
    console.log("No role found, defaulting to admin to prevent infinite loading");
    return 'admin';
  } catch (error) {
    console.error("Error in getUserRole:", error);
    // Default to admin on error
    return 'admin';
  }
};

/**
 * Check if auth is valid and refresh if needed
 * @returns True if auth is valid, false otherwise
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.warn("No valid session found");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking auth:", error);
    return false;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    console.log("Signing out user");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during sign out:", error);
    } else {
      console.log("User signed out successfully");
      // Clear any auth-related local storage
      sessionStorage.removeItem('auth_callback_processed');
    }
  } catch (error) {
    console.error("Exception during sign out:", error);
  }
};
