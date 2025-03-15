
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Checks if a user's email exists in the clients table
 * @param email The email to check
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
};

/**
 * Checks the role of a user in the database
 */
export const checkUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    console.log("Checking user role for:", userId);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, client_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking user role:", error);
      return null;
    }

    if (data?.client_id && data.role === 'client') {
      console.log("Updating user with client_id:", data.client_id);
      await supabase.auth.updateUser({
        data: { client_id: data.client_id }
      });
    }

    console.log("User role found:", data?.role);
    return data?.role as UserRole || null;
  } catch (error) {
    console.error("Exception in checkUserRole:", error);
    return null;
  }
};

/**
 * Creates a role for a user in the database
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
};

/**
 * Handles post-authentication navigation based on user role
 * Always redirects to the appropriate dashboard, regardless of current location
 */
export const handlePostAuthNavigation = (
  role: UserRole, 
  navigate: (path: string, options?: {replace: boolean}) => void
) => {
  console.log("Handling post-auth navigation for role:", role);
  
  if (role === 'admin') {
    navigate('/', { replace: true });
  } else if (role === 'client') {
    navigate('/client/dashboard', { replace: true });
  }
};

/**
 * Force redirect to dashboard based on role, bypassing React Router
 * This provides a faster and more reliable redirect for SSO flows
 */
export const forceRedirectToDashboard = (role: UserRole) => {
  console.log("Force redirecting to dashboard for role:", role);
  if (role === 'admin') {
    window.location.href = '/';
  } else if (role === 'client') {
    window.location.href = '/client/dashboard';
  }
};

/**
 * Handles a Google authenticated user
 * Returns a Promise that resolves with the user's role
 */
export const handleGoogleUser = async (currentUser: User): Promise<UserRole> => {
  if (!currentUser) {
    console.error("handleGoogleUser called with no user");
    throw new Error("No user provided");
  }
  
  console.log("Handling Google user:", currentUser.email);
  
  try {
    // First check if user already has a role
    const existingRole = await checkUserRole(currentUser.id);
    
    if (existingRole) {
      console.log("Existing role found for Google user:", existingRole);
      return existingRole;
    }
    
    console.log("Checking if Google user is a client");
    if (currentUser.email) {
      const isClient = await checkIfClientExists(currentUser.email);
      
      if (isClient) {
        console.log("Google user is a client, fetching client ID");
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
          
        if (clientData?.id) {
          console.log("Creating client role for Google user with client ID:", clientData.id);
          await createUserRole(currentUser.id, 'client', clientData.id);
          
          // Update user metadata with client ID
          await supabase.auth.updateUser({
            data: { client_id: clientData.id }
          });
          
          return 'client';
        }
      }
    }
    
    console.log("Assigning admin role to Google user");
    await createUserRole(currentUser.id, 'admin');
    return 'admin';
  } catch (error) {
    console.error("Error in handleGoogleUser:", error);
    // Default to admin role if there's an error
    console.log("Defaulting to admin role due to error");
    try {
      await createUserRole(currentUser.id, 'admin');
    } catch (roleError) {
      console.error("Failed to create admin role after error:", roleError);
    }
    return 'admin';
  }
};
