
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtendedActivityType } from "@/types/activity";
import { ensureUserRole } from "@/services/clientActivityService";
import { createAiAgentTable } from "@/services/aiAgentTableService";

export const createClientAccount = async (
  clientId: string | null, 
  password: string, 
  confirmPassword: string,
  logActivity: (activity_type: ExtendedActivityType, description: string, metadata?: any) => Promise<void>
) => {
  if (!clientId) {
    toast.error("Invalid setup link");
    return null;
  }

  if (password !== confirmPassword) {
    toast.error("Passwords do not match");
    return null;
  }

  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return null;
  }

  try {
    console.log("Starting account setup process");
    
    // Fetch client email from client ID
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("email, client_name, agent_name")
      .eq("id", clientId)
      .single();
      
    if (clientError || !clientData) {
      console.error("Client lookup error:", clientError);
      throw new Error("Could not find client information");
    }
    
    console.log("Found client:", clientData.email);
    
    // At this point the user should be following an invitation link from Supabase
    // Check if the user already has an account
    const { data: userExists, error: userCheckError } = await supabase.auth.getUser();
    
    let signUpData: any;
    
    if (userExists?.user) {
      console.log("User already exists, updating password");
      // Update existing user's password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) {
        console.error("Password update error:", updateError);
        throw updateError;
      }
      
      signUpData = data;
    } else {
      // Create a new account
      console.log("Creating new account");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: clientData.email,
        password: password,
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }
      
      signUpData = data;
    }
    
    console.log("Account created or updated successfully");
    
    if (signUpData?.user) {
      // Use the ensureUserRole utility to handle role assignment with proper type
      await ensureUserRole(signUpData.user.id, "client", clientId);
      
      // Setup the AI agent table with the tweoo-like structure and permissions
      if (clientData.agent_name) {
        console.log("Creating AI agent table with tweoo-like permissions");
        await createAiAgentTable(clientData.agent_name);
      }
      
      // Set client ID in user metadata
      console.log("Setting client metadata");
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { client_id: clientId }
      });
      
      if (metadataError) {
        console.error("Metadata update error:", metadataError);
        throw metadataError;
      }
    }

    toast.success("Account setup successful! Signing you in...");
    
    // Log this activity
    await logActivity(
      "ai_agent_created", 
      "completed account setup",
      { setup_method: "invitation" }
    );
    
    // Sign in with the new credentials
    console.log("Signing in with new credentials");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: clientData.email,
      password: password,
    });
    
    if (signInError) {
      console.error("Sign in error:", signInError);
      throw signInError;
    }
    
    console.log("Setup complete and signed in, redirecting to client dashboard");
    
    return signUpData;
  } catch (error: any) {
    console.error("Error setting up account:", error);
    toast.error(error.message || "Failed to set up your account");
    throw error;
  }
};
