import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth"; // Import UserRole from types

/**
 * Get the current user's role with improved error handling and timeouts
 * @returns The user's role
 */
export const getUserRole = async (): Promise<UserRole> => {
  try {
    console.log("Getting user role...");
    // Set up a timeout for the role fetch operation
    const timeoutPromise = new Promise<UserRole>((_, reject) => {
      setTimeout(() => reject(new Error("Role fetch operation timed out")), 3000);
    });
    
    const fetchRolePromise = fetchUserRoleFromSources();
    
    // Race between actual fetch and timeout
    const role = await Promise.race([fetchRolePromise, timeoutPromise]);
    return role;
  } catch (error) {
    console.error("Error in getUserRole:", error);
    // Default to admin on error to prevent blocking UI
    return 'admin';
  }
};

// Helper function to fetch user role from multiple sources
const fetchUserRoleFromSources = async (): Promise<UserRole> => {
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
      
      // Store the role in user metadata for faster access next time
      try {
        await supabase.auth.updateUser({
          data: { role: roleData.role }
        });
      } catch (updateErr) {
        console.error("Error updating user metadata with role:", updateErr);
      }
      
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
      
      // Store the role in user metadata for faster access next time
      try {
        await supabase.auth.updateUser({
          data: { role: 'client' }
        });
      } catch (updateErr) {
        console.error("Error updating user metadata with role:", updateErr);
      }
      
      return 'client';
    }
  } catch (clientErr) {
    console.error("Error checking ai_agents table:", clientErr);
  }
  
  // For Google users, default to admin role
  if (isGoogleUser) {
    console.log("Google user with no explicit role, defaulting to admin");
    
    // Store the role in user metadata for faster access next time
    try {
      await supabase.auth.updateUser({
        data: { role: 'admin' }
      });
    } catch (updateErr) {
      console.error("Error updating user metadata with role:", updateErr);
    }
    
    return 'admin';
  }
  
  // Default to admin as a fallback to prevent infinite loading
  console.log("No role found, defaulting to admin to prevent infinite loading");
  return 'admin';
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
    
    // Check if token needs refresh (if less than 5 minutes remaining)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesInSeconds = 5 * 60;
    
    if (expiresAt && expiresAt - now < fiveMinutesInSeconds) {
      console.log("Token expiring soon, refreshing...");
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing token:", error);
        return false;
      }
      console.log("Token refreshed successfully");
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
