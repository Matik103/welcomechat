
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the authentication session is valid and refreshes if needed
 * @returns Promise<boolean> indicating if auth is valid
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error checking auth session:", error);
      return false;
    }
    
    if (!data.session) {
      console.log("No active session found");
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error checking auth session:", err);
    return false;
  }
}

/**
 * Sign out the current user
 * @returns Promise<void>
 */
export const signOutUser = async (): Promise<void> => {
  try {
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
