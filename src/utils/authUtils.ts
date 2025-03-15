
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
  navigate: (path: string, options?: {replace: boolean}) => void
) => {
  console.log("Handling post-auth navigation - redirecting to admin dashboard");
  navigate('/', { replace: true });
};

/**
 * Force redirect to dashboard based on role, bypassing React Router
 * This provides a faster and more reliable redirect for SSO flows
 */
export const forceRedirectToDashboard = () => {
  console.log("Force redirecting to admin dashboard");
  window.location.href = '/';
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
  
  console.log("Handling Google user, redirecting to admin dashboard:", currentUser.email);
  
  // Always assign admin role, with no additional checks
  try {
    await createUserRole(currentUser.id, 'admin');
  } catch (error) {
    console.error("Failed to create admin role, but continuing:", error);
  }
  
  return 'admin';
};
