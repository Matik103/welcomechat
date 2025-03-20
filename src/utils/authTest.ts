
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const isSpamEmail = (email: string): boolean => {
  // Simple spam detection
  const spamDomains = ['spam.com', 'temporary.com', 'fakeemail.com'];
  const domain = email.split('@')[1];
  return spamDomains.includes(domain);
};

/**
 * This is a test function to check client authentication logic
 */
export const testAuthFlow = async () => {
  console.log("Testing auth flow...");
  
  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
      return false;
    }
    
    if (!user) {
      console.log("No user is authenticated");
      return false;
    }
    
    console.log("Authenticated user:", user.email);
    
    // Check if this user exists in our ai_agents table as a client type record
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .select('id, name')
      .eq('email', user.email)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (clientError) {
      console.error("Error checking client:", clientError);
    } else if (clientData) {
      console.log("User is a client:", clientData.name);
    } else {
      console.log("User is not a client. Might be an admin.");
    }
    
    // Check user roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (roleError) {
      console.error("Error checking role:", roleError);
    } else if (roleData) {
      console.log("User role:", roleData.role);
    } else {
      console.log("No role assigned to user");
    }
    
    return true;
  } catch (error) {
    console.error("Auth test failed:", error);
    return false;
  }
};
