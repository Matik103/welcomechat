
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Creates a role for a user in the database
 */
export const createUserRole = async (
  userId: string, 
  role: UserRole
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role
      });
      
    if (error) {
      console.error("Error creating user role:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error in createUserRole:", err);
    return false;
  }
};

/**
 * Force redirect based on user role
 */
export const forceRedirectBasedOnRole = (role: UserRole) => {
  console.log(`Force redirecting to ${role === 'admin' ? 'admin' : 'client'} dashboard`);
  window.location.href = role === 'admin' ? '/' : '/client/dashboard';
};

/**
 * Get user role from database
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    
    return data?.role as UserRole;
  } catch (err) {
    console.error("Error in getUserRole:", err);
    return null;
  }
};

/**
 * Handles an authenticated user
 * Fetches or creates role and returns it
 */
export const handleAuthenticatedUser = async (currentUser: User): Promise<UserRole> => {
  if (!currentUser) {
    console.error("handleAuthenticatedUser called with no user");
    throw new Error("No user provided");
  }
  
  console.log("Handling authenticated user:", currentUser.email);
  
  // Check if user already has a role
  const existingRole = await getUserRole(currentUser.id);
  if (existingRole) {
    console.log("User already has role:", existingRole);
    return existingRole;
  }
  
  // Check if user is from a client domain (this is an example, implement based on your logic)
  // For now, we'll default to admin role
  const role: UserRole = 'admin';
  
  try {
    await createUserRole(currentUser.id, role);
  } catch (error) {
    console.error("Failed to create role, but continuing:", error);
  }
  
  return role;
};
