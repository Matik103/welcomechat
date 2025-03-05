
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtendedActivityType } from "@/types/activity";

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
      .select("email, client_name")
      .eq("id", clientId)
      .single();
      
    if (clientError || !clientData) {
      console.error("Client lookup error:", clientError);
      throw new Error("Could not find client information");
    }
    
    console.log("Found client:", clientData.email);
    
    // Create user account with client's email
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: clientData.email,
      password: password,
    });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      throw signUpError;
    }
    
    console.log("Account created successfully");
    
    if (signUpData.user) {
      // First check if the user role mapping already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", signUpData.user.id)
        .eq("role", "client")
        .maybeSingle();
      
      // Only create role mapping if it doesn't exist
      if (!existingRole) {
        console.log("Creating user role mapping");
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signUpData.user.id,
            role: "client",
            client_id: clientId
          });
          
        if (roleError) {
          console.error("Role mapping error:", roleError);
          throw roleError;
        }
      } else {
        console.log("User role already exists, updating client_id");
        // Update the existing role with the client_id if needed
        const { error: updateRoleError } = await supabase
          .from("user_roles")
          .update({ client_id: clientId })
          .eq("user_id", signUpData.user.id)
          .eq("role", "client");
          
        if (updateRoleError) {
          console.error("Role update error:", updateRoleError);
          throw updateRoleError;
        }
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
      "ai_agent_created", // Using our enum value
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
