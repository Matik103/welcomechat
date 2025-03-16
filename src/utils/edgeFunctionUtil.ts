
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to test Edge Function connectivity
 * @returns Promise with a boolean indicating if the test was successful
 */
export const testEdgeFunctionConnectivity = async (): Promise<boolean> => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) {
      console.error("Session error:", sessionError);
      toast.error("Authentication issue: " + (sessionError?.message || "No valid session"));
      return false;
    }
    
    // Simple SQL to test connectivity
    const testSql = "SELECT current_timestamp as time";
    
    // Try to call the Edge Function
    const { data, error } = await supabase.functions.invoke('execute_sql', {
      body: { sql: testSql },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    if (error) {
      console.error("Edge Function test failed:", error);
      toast.error("Edge Function connectivity test failed: " + error.message);
      return false;
    }
    
    console.log("Edge Function test successful:", data);
    toast.success("Edge Function connectivity test successful");
    return true;
  } catch (error) {
    console.error("Edge Function test error:", error);
    toast.error("Edge Function test error: " + (error.message || "Unknown error"));
    return false;
  }
};

/**
 * Helper function to get a valid auth token for Edge Function calls
 * @returns Promise with the access token or null if not available
 */
export const getEdgeFunctionAuthToken = async (): Promise<string | null> => {
  try {
    // First try to get an existing session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return null;
    }
    
    // If we have a session with an access token, return it
    if (sessionData.session?.access_token) {
      return sessionData.session.access_token;
    }
    
    // If no valid session found, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Session refresh error:", refreshError);
      return null;
    }
    
    return refreshData.session?.access_token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};
