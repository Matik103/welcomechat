
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

/**
 * Check a user's role by email
 * @param email Email of the user to check
 * @returns Promise with user role information
 */
export const checkUserRoleByEmail = async (email: string): Promise<{ 
  success: boolean; 
  roles?: string[]; 
  message?: string;
}> => {
  try {
    if (!email) {
      return { success: false, message: "Email is required" };
    }
    
    // Get auth token
    const token = await getEdgeFunctionAuthToken();
    if (!token) {
      return { success: false, message: "Authentication required to check user role" };
    }
    
    // Escape single quotes in the email for SQL safety
    const safeEmail = email.replace(/'/g, "''");
    
    // SQL to find user and their roles
    const sql = `
      SELECT u.id, u.email, r.role 
      FROM auth.users u
      LEFT JOIN public.user_roles r ON u.id = r.user_id
      WHERE u.email = '${safeEmail}'
    `;
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('execute_sql', {
      body: { sql },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (error) {
      console.error("Error checking user role:", error);
      return { success: false, message: `Error checking role: ${error.message}` };
    }
    
    // Process the result
    if (!data?.result || !Array.isArray(data.result) || data.result.length === 0) {
      return { success: false, message: `User with email ${email} not found` };
    }
    
    // Extract roles from the result
    const roles = data.result
      .filter(row => row.role)
      .map(row => row.role);
    
    return { 
      success: true, 
      roles,
      message: roles.length ? `User has roles: ${roles.join(', ')}` : 'User has no assigned roles'
    };
  } catch (error) {
    console.error("Error in checkUserRoleByEmail:", error);
    return { success: false, message: error.message || "Unknown error occurred" };
  }
};
