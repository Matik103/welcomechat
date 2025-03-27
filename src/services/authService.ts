
import { supabase } from "@/integrations/supabase/client";

// Define UserRole type directly as string literals
type UserRole = 'admin' | 'client';

/**
 * Get the current user's role
 * @returns The user's role
 */
export const getUserRole = async (): Promise<UserRole> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 'admin'; // Default if no user is found
    }
    
    // Option 1: Check user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!roleError && roleData && roleData.role) {
      return roleData.role as UserRole;
    }
    
    // Option 2: Check user metadata
    if (user.user_metadata && typeof user.user_metadata === 'object') {
      const role = user.user_metadata.role;
      if (role === 'admin' || role === 'client') {
        return role;
      }
    }
    
    // Option 3: Check if user has a corresponding client in ai_agents
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('email', user.email)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (!clientError && clientData) {
      return 'client';
    }
    
    // Default to admin if no role found
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
      return false;
    }
    
    // Auto-refresh token if it's about to expire
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          console.error("Error refreshing auth token:", error);
          return false;
        }
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
  await supabase.auth.signOut();
};
