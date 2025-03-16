
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { createUserRole } from "./authUtils";
import { toast } from "sonner";

/**
 * Migrates existing admin users to the user_roles table
 * This is a one-time migration utility
 */
export const migrateExistingAdmins = async (): Promise<{ success: boolean, count: number }> => {
  try {
    // First, check which users already have roles assigned
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id');
    
    if (rolesError) {
      console.error("Error fetching existing roles:", rolesError);
      return { success: false, count: 0 };
    }
    
    const usersWithRoles = new Set(existingRoles.map(r => r.user_id));
    
    // Get auth session for use with Edge Function
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error getting auth session:", sessionError);
      toast.error("Authentication error: " + sessionError.message);
      throw new Error("Authentication required. Please log in again.");
    }
    
    if (!sessionData.session?.access_token) {
      toast.error("No authentication token available. Please sign in again.");
      throw new Error("Authentication required. Please log in again.");
    }
    
    // Call execute_sql Edge Function to list users
    const sqlQuery = `SELECT id, email, raw_app_meta_data FROM auth.users`;
    
    const { data: usersData, error: usersError } = await supabase.functions.invoke('execute_sql', {
      body: { sql: sqlQuery },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      toast.error("Failed to access user data: " + usersError.message);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    if (!usersData || !usersData.result || !Array.isArray(usersData.result)) {
      console.error("Unexpected response format:", usersData);
      toast.error("Unexpected data format received from server");
      return { success: false, count: 0 };
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Process users without roles
    for (const user of usersData.result) {
      if (!usersWithRoles.has(user.id)) {
        // Parse app_metadata from raw_app_meta_data
        let appMetadata;
        try {
          appMetadata = typeof user.raw_app_meta_data === 'string' 
            ? JSON.parse(user.raw_app_meta_data) 
            : user.raw_app_meta_data;
        } catch (e) {
          console.error("Error parsing app_metadata:", e);
          appMetadata = {};
        }
        
        // Check for Google SSO users
        const isGoogleUser = appMetadata?.provider === 'google';
        
        // Google SSO users are always admins
        const role = isGoogleUser ? 'admin' : (appMetadata?.role || 'admin');
        
        try {
          // Use the createUserRole function with the correct parameters
          const success = await createUserRole(user.id, role as UserRole);
          
          if (success) {
            migratedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error migrating user ${user.email}:`, error);
          errorCount++;
        }
      }
    }
    
    if (errorCount > 0) {
      toast.warning(`Migration completed with ${errorCount} errors. ${migratedCount} users were successfully migrated.`);
    } else {
      console.log(`Successfully migrated ${migratedCount} users to the user_roles table`);
    }
    
    return { success: true, count: migratedCount };
  } catch (error: any) {
    console.error("Error in migrateExistingAdmins:", error);
    throw error;
  }
};

/**
 * A function to manually add an admin role to a specific user by email
 */
export const addAdminRoleToUser = async (email: string): Promise<boolean> => {
  try {
    if (!email) {
      toast.error("Email is required");
      throw new Error("Email is required");
    }
    
    // Get auth session for use with Edge Function
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Error getting auth session:", sessionError);
      toast.error("Authentication error: " + sessionError.message);
      throw new Error("Authentication required. Please log in again.");
    }
    
    if (!sessionData.session?.access_token) {
      toast.error("No authentication token available. Please sign in again.");
      throw new Error("Authentication required. Please log in again.");
    }
    
    // Call execute_sql Edge Function to find user by email
    const sqlQuery = `SELECT id, email FROM auth.users WHERE email = '${email.replace(/'/g, "''")}'`;
    
    const { data: userData, error: userError } = await supabase.functions.invoke('execute_sql', {
      body: { sql: sqlQuery },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    if (userError) {
      console.error("Error fetching user:", userError);
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }
    
    if (!userData || !userData.result || !Array.isArray(userData.result) || userData.result.length === 0) {
      console.error(`User with email ${email} not found`);
      throw new Error(`User with email ${email} not found`);
    }
    
    const user = userData.result[0];
    
    // Check if user already has an admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (existingRole) {
      console.log(`User ${email} already has admin role`);
      return true;
    }
    
    // Add admin role
    const success = await createUserRole(user.id, 'admin');
    
    if (success) {
      console.log(`Successfully added admin role to user ${email}`);
    } else {
      throw new Error(`Failed to create admin role for ${email}`);
    }
    
    return success;
  } catch (error: any) {
    console.error("Error in addAdminRoleToUser:", error);
    throw error;
  }
};
