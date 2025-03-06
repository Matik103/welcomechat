
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the authentication session is valid and refreshes if needed
 * @returns Promise<boolean> indicating if auth is valid
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      console.log("Auth session error or missing:", error);
      // Session is invalid, try refreshing
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Failed to refresh auth session:", refreshError);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("Error checking auth session:", err);
    return false;
  }
}

/**
 * Gets the current user
 * @returns Promise with user data or null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data.user;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}
