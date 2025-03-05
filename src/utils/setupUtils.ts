
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtendedActivityType } from "@/types/activity";
import { ensureUserRole } from "@/services/clientActivityService";
import { createAiAgentTable } from "@/services/aiAgentTableService";

// Function to generate a random password
const generateTemporaryPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const createClientAccount = async (
  clientId: string | null, 
  logActivity: (activity_type: ExtendedActivityType, description: string, metadata?: any) => Promise<void>
) => {
  if (!clientId) {
    toast.error("Invalid setup link");
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
    
    // Generate a temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Create user account with client's email and the temporary password
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: clientData.email,
      password: temporaryPassword,
    });

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      throw signUpError;
    }
    
    console.log("Account created successfully");
    
    if (signUpData.user) {
      // Use the ensureUserRole utility to handle role assignment with proper type
      await ensureUserRole(signUpData.user.id, "client", clientId);
      
      // Setup the AI agent table with the correct permissions
      if (clientData.agent_name) {
        await createAiAgentTable(clientData.agent_name);
      }
      
      // Set client ID in user metadata
      console.log("Setting client metadata");
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          client_id: clientId,
          password_change_required: true // Flag to show password change reminder
        }
      });
      
      if (metadataError) {
        console.error("Metadata update error:", metadataError);
        throw metadataError;
      }

      // Send confirmation email with temporary password
      try {
        console.log("Sending confirmation email to client");
        await supabase.functions.invoke("send-setup-confirmation", {
          body: { 
            email: clientData.email,
            clientName: clientData.client_name,
            temporaryPassword: temporaryPassword
          }
        });
        console.log("Confirmation email sent successfully");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't throw error here, just log it - we don't want to stop the process
      }
    }

    toast.success("Account setup successful! Confirmation email sent.");
    
    // Log this activity
    await logActivity(
      "ai_agent_created",
      "Set up client account and sent confirmation email",
      { setup_method: "invitation" }
    );
    
    return signUpData;
  } catch (error: any) {
    console.error("Error setting up account:", error);
    toast.error(error.message || "Failed to set up client account");
    throw error;
  }
};
