import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { execSql } from "@/utils/rpcUtils";

/**
 * Check and refresh authentication token if needed
 */
export const checkAndRefreshAuth = async () => {
  const { data } = await supabase.auth.getSession();
  
  // If session exists but is about to expire, refresh it
  if (data?.session) {
    const expiresAt = data.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    
    // If token expires in less than 5 minutes (300 seconds), refresh it
    if (timeUntilExpiry < 300) {
      console.log("Auth token expiring soon, refreshing...");
      await supabase.auth.refreshSession();
    }
  }
};

/**
 * Get the current authenticated user role
 */
export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    await checkAndRefreshAuth();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Use SQL query via RPC instead of direct table access
    const query = `
      SELECT role FROM user_roles WHERE user_id = '${user.id}' LIMIT 1
    `;
    
    const result = await execSql(query);
    
    if (result && result.length > 0) {
      return result[0].role;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

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

/**
 * Checks if a user's email exists in the clients table
 * @param email The email to check
 * @returns Promise<boolean> indicating if the client exists
 */
export const checkIfClientExists = async (email: string): Promise<boolean> => {
  try {
    if (!email) return false;
    
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking client existence:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error in checkIfClientExists:", err);
    return false;
  }
}

/**
 * Creates a role for a user in the database
 * @param userId User's Supabase ID
 * @param role Role to assign
 * @param clientId Optional client ID for client roles
 * @returns Promise<boolean> indicating success
 */
export const createUserRole = async (
  userId: string, 
  role: UserRole, 
  clientId?: string
): Promise<boolean> => {
  try {
    const roleData: any = {
      user_id: userId,
      role: role
    };
    
    if (clientId && role === 'client') {
      roleData.client_id = clientId;
    }
    
    const { error } = await supabase
      .from('user_roles')
      .insert(roleData);
      
    if (error) {
      console.error("Error creating user role:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error in createUserRole:", err);
    return false;
  }
}

/**
 * Recovers and validates the authentication session
 * @returns Promise with the recovered session or null
 */
export const recoverAuthSession = async () => {
  try {
    // First try to get the session from storage
    const { data: { session: storedSession } } = await supabase.auth.getSession();
    
    if (storedSession) {
      // Validate the session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        return storedSession;
      }
    }
    
    // If no valid stored session, try to refresh
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Failed to refresh session:", error);
      return null;
    }
    
    return session;
  } catch (err) {
    console.error("Error recovering auth session:", err);
    return null;
  }
}
