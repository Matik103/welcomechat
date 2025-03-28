
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
    
    // Option 1: Check user_roles table
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
    
    // Option 2: Check user metadata
    if (user.user_metadata && typeof user.user_metadata === 'object') {
      const role = user.user_metadata.role;
      if (role === 'admin' || role === 'client') {
        console.log("Role found in user metadata:", role);
        return role as UserRole;
      }
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
    
    // Default to admin if no role found
    console.log("No role found, defaulting to admin");
    return 'admin';
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return 'admin'; // Default on error
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
    
    // Auto-refresh token if it's about to expire
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log("Token is about to expire, refreshing...");
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          console.error("Error refreshing auth token:", error);
          return false;
        }
        
        console.log("Token refreshed successfully");
      }
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during sign out:", error);
    } else {
      console.log("User signed out successfully");
    }
  } catch (error) {
    console.error("Exception during sign out:", error);
  }
};
