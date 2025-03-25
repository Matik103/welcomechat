
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";
import { generateTempPassword } from "./passwordUtils";

/**
 * Create a new client account
 * @param clientName The client name
 * @param email The client email
 * @param agentName Optional agent name
 * @returns The created client ID
 */
export const createClientAccount = async (
  clientName: string,
  email: string,
  agentName?: string
): Promise<string> => {
  try {
    // Call the RPC function to create a client
    const { data, error } = await supabase.rpc('create_new_client', {
      p_client_name: clientName,
      p_email: email,
      p_agent_name: agentName || 'AI Assistant'
    });
    
    if (error) throw error;
    
    // Return the client ID
    return data as string;
  } catch (error) {
    console.error("Error creating client account:", error);
    throw error;
  }
};

/**
 * Generate and save a temporary password for a client
 * @param clientId The client ID
 * @param email The client email
 * @returns The generated temporary password
 */
export const generateAndSaveClientPassword = async (
  clientId: string,
  email: string
): Promise<string> => {
  try {
    // Generate a temporary password
    const tempPassword = generateTempPassword();
    
    // Save the temporary password
    const { error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString(),
        used: false
      });
    
    if (error) throw error;
    
    return tempPassword;
  } catch (error) {
    console.error("Error generating and saving client password:", error);
    throw error;
  }
};

/**
 * Check if a client with the given email already exists
 * @param email The email to check
 * @returns Whether the client exists
 */
export const checkClientExists = async (email: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('ai_agents')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .eq('interaction_type', 'config');
    
    if (error) throw error;
    
    return (count || 0) > 0;
  } catch (error) {
    console.error("Error checking if client exists:", error);
    return false;
  }
};

/**
 * Log client creation activity
 * @param clientId The client ID
 * @param clientName The client name
 * @param email The client email
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string
): Promise<void> => {
  try {
    await createActivityDirect(
      clientId,
      'client_created',
      `Client ${clientName} created with email ${email}`,
      { client_name: clientName, email }
    );
  } catch (error) {
    console.error("Error logging client creation activity:", error);
    // Non-blocking - don't throw
  }
};
