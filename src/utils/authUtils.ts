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
  
  // Clear loading state by adding a feedback element
  const loadingFeedback = document.createElement('div');
  loadingFeedback.textContent = `Redirecting to ${role === 'admin' ? 'admin' : 'client'} dashboard...`;
  loadingFeedback.style.position = 'fixed';
  loadingFeedback.style.top = '50%';
  loadingFeedback.style.left = '50%';
  loadingFeedback.style.transform = 'translate(-50%, -50%)';
  loadingFeedback.style.backgroundColor = 'white';
  loadingFeedback.style.padding = '20px';
  loadingFeedback.style.borderRadius = '5px';
  loadingFeedback.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  loadingFeedback.style.zIndex = '9999';
  document.body.appendChild(loadingFeedback);
  
  // Use timeout to ensure state updates and rendering completes
  setTimeout(() => {
    const redirectUrl = role === 'admin' ? '/' : '/client/dashboard';
    console.log(`Performing actual redirect to: ${redirectUrl}`);
    window.location.href = redirectUrl;
  }, 500); // Increased timeout for more reliability
};

/**
 * Get user role from database
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  if (!userId) {
    console.error("getUserRole called with no userId");
    return null;
  }

  try {
    console.log(`Getting role for user ${userId}`);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
    
    console.log(`Found role for user ${userId}: ${data?.role || 'none'}`);
    
    // If we got data but no role, this is unexpected but we'll handle it
    if (data && !data.role) {
      console.warn("Role record exists but has no role value, treating as null");
      return null;
    }
    
    return data?.role as UserRole || null;
  } catch (err) {
    console.error("Error in getUserRole:", err);
    return null;
  }
};

/**
 * Check if email exists in clients table
 */
export const isClientInDatabase = async (email: string): Promise<boolean> => {
  try {
    if (!email) {
      console.log("No email provided to isClientInDatabase");
      return false;
    }
    
    console.log(`Checking if email exists in clients table: ${email}`);
    
    // Check if email exists in clients table
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (error) {
      console.error("Error checking client in database:", error);
      return false;
    }
    
    const exists = !!data;
    console.log(`Email ${email} ${exists ? 'found' : 'not found'} in clients table`);
    return exists; // Return true if client exists, false otherwise
  } catch (err) {
    console.error("Error in isClientInDatabase:", err);
    return false;
  }
};

/**
 * Handles an authenticated user
 * Determines role by checking clients table and returns it
 */
export const handleAuthenticatedUser = async (currentUser: User): Promise<UserRole> => {
  if (!currentUser) {
    console.error("handleAuthenticatedUser called with no user");
    console.log("Defaulting to admin role due to missing user");
    return 'admin'; // Default to admin instead of throwing
  }
  
  console.log("Handling authenticated user:", currentUser.email);
  
  // Check if user already has a role
  const existingRole = await getUserRole(currentUser.id);
  if (existingRole) {
    console.log("User already has role:", existingRole);
    return existingRole;
  }
  
  // If user doesn't have a role yet, determine it based on whether they exist in the clients table
  try {
    const isClient = currentUser.email ? await isClientInDatabase(currentUser.email) : false;
    const role: UserRole = isClient ? 'client' : 'admin';
    
    console.log(`Assigning role '${role}' to user with email: ${currentUser.email}`);
    
    try {
      const success = await createUserRole(currentUser.id, role);
      if (!success) {
        console.error("Failed to create role in database");
        // Default to admin if we failed to create the role
        console.log("Defaulting to admin role due to database error");
        return 'admin';
      }
    } catch (error) {
      console.error("Failed to create role, but continuing:", error);
      // Default to admin in case of error
      console.log("Defaulting to admin role due to error");
      return 'admin';
    }
    
    return role;
  } catch (err) {
    console.error("Error determining role:", err);
    console.log("Defaulting to admin role due to error in role determination");
    return 'admin';
  }
};
