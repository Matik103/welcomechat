
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
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingRole) {
      console.log(`User role already exists: ${existingRole.role}`);
      return true;
    }
    
    console.log(`Creating role for user ${userId}: ${role}`);
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
    
    console.log(`Successfully created ${role} role for user ${userId}`);
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
  
  // Small delay to ensure state updates and rendering completes
  setTimeout(() => {
    window.location.href = role === 'admin' ? '/' : '/client/dashboard';
  }, 100);
};

/**
 * Get user role from database
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    console.log(`Getting role for user ${userId}`);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    
    console.log(`Found role for user ${userId}: ${data?.role}`);
    return data?.role as UserRole;
  } catch (err) {
    console.error("Error in getUserRole:", err);
    return null;
  }
};

/**
 * Determine if a user email belongs to a client domain
 * This would be where you implement your domain-based role logic
 */
export const isClientDomain = (email: string): boolean => {
  // This is where you would implement your actual client domain detection logic
  // For example, if all emails from domain clientcompany.com should be clients:
  // return email.toLowerCase().endsWith('@clientcompany.com');
  
  // For now, let's make a simple demo rule
  // Update this with your actual business logic to determine client vs admin roles
  return email.toLowerCase().includes('client') || email.toLowerCase().includes('user');
}

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
  
  // If user doesn't have a role yet, determine it based on email domain or other logic
  const isClient = currentUser.email ? isClientDomain(currentUser.email) : false;
  const role: UserRole = isClient ? 'client' : 'admin';
  
  console.log(`Assigning role '${role}' to user with email: ${currentUser.email}`);
  
  try {
    const success = await createUserRole(currentUser.id, role);
    if (!success) {
      console.error("Failed to create role in database");
    }
  } catch (error) {
    console.error("Failed to create role, but continuing:", error);
  }
  
  return role;
};
