
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

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
 * Checks if a user registered using Google SSO
 */
export const isGoogleSSOUser = async (userId: string): Promise<boolean> => {
  try {
    // Getting user method is not available in client-side code, rely on app_metadata
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      console.error("Error checking if user is Google SSO user:", error);
      return false;
    }
    
    // Check provider in app_metadata
    const isGoogleProvider = data.user.app_metadata?.provider === 'google';
    
    console.log(`User ${userId} ${isGoogleProvider ? 'is' : 'is not'} a Google SSO user`);
    return !!isGoogleProvider;
  } catch (err) {
    console.error("Error in isGoogleSSOUser:", err);
    return false;
  }
};

/**
 * Handles role determination for authenticated users
 */
export const determineUserRole = async (user: User): Promise<UserRole> => {
  if (!user || !user.email) {
    console.error("determineUserRole called with no user or email");
    return 'admin'; // Default to admin for safety
  }
  
  try {
    // Check if the user is using Google SSO
    const isGoogleUser = user.app_metadata?.provider === 'google';
    
    // Google SSO users are ALWAYS admins, regardless of whether their email
    // exists in the clients table
    if (isGoogleUser) {
      console.log(`User ${user.email} is using Google SSO, treating as admin regardless of client status`);
      return 'admin';
    }
    
    // For non-Google users, check if they're in clients table
    const isClient = await isClientInDatabase(user.email);
    
    console.log(`User ${user.email} role determined as: ${isClient ? 'client' : 'admin'}`);
    return isClient ? 'client' : 'admin';
  } catch (error) {
    console.error("Error determining user role:", error);
    return 'admin'; // Default to admin in case of errors
  }
};

/**
 * Force redirect based on user role
 */
export const forceRedirectBasedOnRole = (role: UserRole) => {
  console.log(`Force redirecting to ${role === 'admin' ? 'admin' : 'client'} dashboard`);
  
  // Use direct window location change to ensure a clean redirect
  if (role === 'admin') {
    window.location.href = '/';
  } else {
    window.location.href = '/client/dashboard';
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
