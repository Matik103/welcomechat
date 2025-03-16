
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

/**
 * Determines the user role by checking for client records
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  if (!user) return 'admin'; // Default fallback
  
  // Check if the user authenticated via Google SSO
  const isGoogleUser = user.app_metadata?.provider === 'google';
  
  // All Google SSO users are automatically assigned admin role
  if (isGoogleUser) {
    console.log("Google SSO user detected - assigning admin role:", user.email);
    return 'admin';
  }
  
  try {
    // For email/password users, check if they are clients
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();
    
    if (clientError) {
      console.error("Error checking client status:", clientError);
      return 'admin'; // Default to admin on error
    }
    
    // If we found a client record with this email, they're a client
    if (clientData) {
      console.log("User determined to be a client:", user.email);
      
      // Store the client_id in user metadata if it's not already there
      if (!user.user_metadata?.client_id && clientData.id) {
        try {
          await supabase.auth.updateUser({
            data: { client_id: clientData.id }
          });
        } catch (err) {
          console.error("Error updating user metadata with client_id:", err);
        }
      }
      
      return 'client';
    }
    
    // If no client record found, assume they're an admin
    console.log("User determined to be an admin:", user.email);
    return 'admin';
  } catch (err) {
    console.error("Error in determineUserRole:", err);
    return 'admin'; // Default to admin on error
  }
};

/**
 * Redirects to appropriate dashboard based on role
 */
export const forceRedirectBasedOnRole = (role: UserRole) => {
  if (role === 'client') {
    window.location.href = '/client/dashboard';
  } else {
    window.location.href = '/';
  }
};

/**
 * Creates a user role in the database
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
 * Check if email exists in clients table
 */
export const isClientInDatabase = async (email: string): Promise<boolean> => {
  if (!email) return false;
  
  try {
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
    console.error("Error in isClientInDatabase:", err);
    return false;
  }
};
