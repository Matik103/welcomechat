
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if authentication is valid and refreshes the session if needed
 * @returns Promise<boolean> - Whether auth is valid
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn("No active session found");
      return false;
    }
    
    // Check if token is expired or will expire soon (within 5 minutes)
    const expiresAt = sessionData.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && expiresAt - now < fiveMinutes) {
      console.log("Session token will expire soon, refreshing...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Failed to refresh session:", error);
        return false;
      }
      
      return !!data.session;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
};
