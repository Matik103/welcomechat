
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSecurePassword } from "@/utils/passwordUtils";

/**
 * Generates a temporary password for client accounts
 * @returns A randomly generated temporary password
 */
export const generateTempPassword = (): string => {
  return generateSecurePassword();
};

/**
 * Saves a temporary password for a client
 * @param clientId The client ID
 * @param email The client's email address
 * @param tempPassword The temporary password
 */
export const saveClientTempPassword = async (
  clientId: string,
  email: string,
  tempPassword: string
): Promise<void> => {
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
      throw error;
    }
    
    // Create auth user with the same password
    const { data: userData, error: createUserError } = await supabase.functions.invoke(
      'create-client-user',
      {
        body: {
          email: email,
          client_id: clientId,
          temp_password: tempPassword
        }
      }
    );
    
    if (createUserError) {
      console.error("Error creating user auth:", createUserError);
      // We continue as the temp password is saved
    } else {
      console.log("User auth created successfully:", userData);
    }
    
  } catch (err) {
    console.error("Failed to save client temp password:", err);
    toast.error("Failed to set up client credentials");
  }
};

/**
 * Logs client creation activity
 * @param clientId The client ID
 * @param clientName The client name
 * @param email The client's email
 * @param agentName The agent name
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<void> => {
  try {
    await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_created",
        description: `New client created: ${clientName}`,
        metadata: {
          client_name: clientName,
          email: email,
          agent_name: agentName
        }
      });
  } catch (err) {
    console.error("Failed to log client creation activity:", err);
    // Non-critical error, just log it
  }
};
