
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the authentication session is valid and refreshes if needed
 * @returns Promise<boolean> indicating if auth is valid
 */
export const checkAndRefreshAuth = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
