
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
      await supabase.auth.updateUser({
        data: { client_id: data.client_id }
      });
    }

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
 * Handles a Google authenticated user
 */
export const handleGoogleUser = async (currentUser: User): Promise<UserRole> => {
  console.log("Handling Google user:", currentUser.email);
  const existingRole = await checkUserRole(currentUser.id);
  
  if (existingRole) {
    console.log("Existing role found for Google user:", existingRole);
    return existingRole;
  }
  
  console.log("Assigning admin role to Google user");
  await createUserRole(currentUser.id, 'admin');
  return 'admin';
};
