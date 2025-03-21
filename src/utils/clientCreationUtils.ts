
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves a temporary password for a client account
 */
export const saveClientTempPassword = async (clientId: string, email: string, tempPassword: string) => {
  try {
    const { error } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });
    
    if (error) {
      console.error("Error saving temporary password:", error);
      throw new Error("Failed to save temporary password");
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving client temp password:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Generates a secure temporary password
 */
export const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

/**
 * Logs client creation activity in the database
 */
export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string, 
  email: string,
  agentName: string
) => {
  try {
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_created",
        description: `New client created with AI agent: ${agentName}`,
        metadata: {
          client_name: clientName,
          email: email,
          agent_name: agentName
        }
      });
      
    return { success: true };
  } catch (error) {
    console.error("Error logging client creation:", error);
    // Non-critical error, don't throw
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};
