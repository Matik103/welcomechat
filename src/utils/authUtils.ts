
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking if user is Google SSO user:", error);
      return false;
    }
    
    // Fetch the identity providers for this user
    const { data: identities, error: identitiesError } = await supabase.auth.admin.listIdentities({
      userId: userId
    });
    
    if (identitiesError) {
      console.error("Error fetching user identities:", identitiesError);
      return false;
    }
    
    // Check if Google is among the identity providers
    const hasGoogleProvider = identities?.identities?.some(
      identity => identity.provider === 'google'
    );
    
    console.log(`User ${userId} ${hasGoogleProvider ? 'is' : 'is not'} a Google SSO user`);
    return !!hasGoogleProvider;
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
    // Check if the user's email exists in the clients table
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
