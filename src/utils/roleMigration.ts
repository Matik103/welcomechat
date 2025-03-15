
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { createUserRole } from "./authUtils";
import { User } from "@supabase/supabase-js";

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
    
    // Get all users - fixed the incorrect API call
    const { data, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return { success: false, count: 0 };
    }
    
    let migratedCount = 0;
    
    // Process users without roles, ensuring they have the correct type
    if (data && data.users) {
      for (const user of data.users) {
        if (!usersWithRoles.has(user.id)) {
          // Check user metadata for role indicators
          const role = user.app_metadata?.role || 'admin'; // Default to admin for existing users
          
          // Fixed: Removed the third argument as createUserRole only accepts userId and role
          const success = await createUserRole(
            user.id, 
            role as UserRole
          );
          
          if (success) {
            migratedCount++;
          }
        }
      }
    }
    
    console.log(`Successfully migrated ${migratedCount} users to the user_roles table`);
    return { success: true, count: migratedCount };
  } catch (error) {
    console.error("Error in migrateExistingAdmins:", error);
    return { success: false, count: 0 };
  }
};

/**
 * A simple function to manually add an admin role to a specific user by email
 */
export const addAdminRoleToUser = async (email: string): Promise<boolean> => {
  try {
    // Find the user by email
    const { data, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return false;
    }
    
    if (!data || !data.users) {
      console.error("No users data returned");
      return false;
    }
    
    // Explicitly type the user to ensure TypeScript recognizes the properties
    const user = data.users.find((u: User) => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return false;
    }
    
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
    
    // Add admin role - fixed to use only 2 arguments
    const success = await createUserRole(user.id, 'admin');
    
    if (success) {
      console.log(`Successfully added admin role to user ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error("Error in addAdminRoleToUser:", error);
    return false;
  }
};

