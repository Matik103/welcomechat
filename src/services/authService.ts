
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the authentication session is valid and refreshes if needed
 * @returns Promise<boolean> indicating if auth is valid
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    console.log("Checking auth session validity");
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error checking auth session:", error);
      return false;
    }
    
    if (!data.session) {
      console.log("No active session found");
      return false;
    }
    
    console.log("Valid session found:", data.session.user.id);
    
    // Check if session is about to expire (less than 30 minutes remaining)
    const expiresAt = data.session.expires_at;
    if (expiresAt) {
      const expiryTime = new Date(expiresAt * 1000);
      const now = new Date();
      const diffMs = expiryTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      console.log(`Session expires in ${diffMins} minutes`);
      
      // If less than 30 minutes remaining, attempt to refresh the session
      if (diffMins < 30) {
        console.log("Session expiring soon, refreshing");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          return false;
        }
        
        if (!refreshData.session) {
          console.log("Failed to get a new session when refreshing");
          return false;
        }
        
        console.log("Session refreshed successfully");
      }
    }
    
    return true;
  } catch (err) {
    console.error("Error in checkAndRefreshAuth:", err);
    return false;
  }
}

/**
 * Sign out the current user
 * @returns Promise<void>
 */
export const signOutUser = async (): Promise<void> => {
  try {
    console.log("Starting sign out process");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
    console.log("Signed out successfully from Supabase");
  } catch (error) {
    console.error("Sign out failed:", error);
    throw error;
  }
}

/**
 * Get the current user details from Supabase
 * @returns Promise with user data or null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}
