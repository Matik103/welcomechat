
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { generatePassword } from "./passwordUtils";
import { createActivityDirect } from "@/services/clientActivityService";

/**
 * Generate a temporary password for a client
 * @param clientId Client ID
 * @param email Client email
 * @returns Generated temporary password
 */
export const generateClientTempPassword = async (clientId: string, email: string): Promise<string> => {
  try {
    console.log(`Generating temporary password for client ${clientId}`);
    
    // Generate a secure password
    const tempPassword = generatePassword(12);
    
    // Store in database
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId, // Use agent_id instead of client_id
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error generating client temp password:", error);
      throw error;
    }
    
    console.log("Generated temporary password successfully");
    return tempPassword;
  } catch (error) {
    console.error("Error in generateClientTempPassword:", error);
    throw error;
  }
};

/**
 * Log client creation activity
 * @param clientId Client ID
 * @param clientName Client name
 * @param email Client email
 */
export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string,
  email: string
): Promise<void> => {
  try {
    await createActivityDirect(
      clientId,
      "client_created",
      `Client ${clientName} (${email}) was created`,
      {
        client_name: clientName,
        email: email,
        created_at: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error("Error logging client creation:", error);
    // Non-blocking, so we just log the error
  }
};
