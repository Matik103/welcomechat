
import { ClientFormData } from "@/types/client-form";
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword, saveClientTempPassword } from "./passwordUtils";

/**
 * Create an agent record in the database
 */
export const createClientInDatabase = async (data: ClientFormData, clientId: string): Promise<any> => {
  try {
    console.log("Creating agent in database with client_id:", clientId);
    
    // Sanitize agent name and description
    const sanitizedAgentName = data.widget_settings?.agent_name?.replace(/["']/g, "") || "AI Assistant";
    const sanitizedAgentDescription = data.widget_settings?.agent_description?.replace(/["']/g, "") || "";

    // Insert the agent record
    const { data: newAgent, error } = await supabase
      .from("ai_agents")
      .insert({
        client_name: data.client_name,
        email: data.email,
        name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        logo_url: data.widget_settings?.logo_url || null,
        logo_storage_path: data.widget_settings?.logo_storage_path || null,
        client_id: clientId, // Explicitly set the client_id
        content: "",
        interaction_type: 'config',
        settings: {
          client_name: data.client_name,
          email: data.email,
          agent_name: sanitizedAgentName,
          agent_description: sanitizedAgentDescription,
          logo_url: data.widget_settings?.logo_url,
          logo_storage_path: data.widget_settings?.logo_storage_path,
          client_id: clientId // Include client_id in settings for consistency
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent in database:", error);
      throw new Error(error.message);
    }

    if (!newAgent) {
      throw new Error("Failed to create agent - no record returned");
    }

    console.log("Agent created in database successfully:", newAgent);
    return newAgent;
  } catch (error: any) {
    console.error("Error in createClientInDatabase:", error);
    throw new Error(error?.message || "Failed to create agent in database");
  }
};

/**
 * Set up a temporary password for a client and save it in the database
 */
export const setupClientPassword = async (clientId: string, email: string): Promise<string> => {
  try {
    // Generate a temporary password
    const tempPassword = generateClientTempPassword();
    
    // Save the temporary password
    await saveClientTempPassword(clientId, email, tempPassword);
    
    // Return the generated password
    return tempPassword;
  } catch (error: any) {
    console.error("Error in setupClientPassword:", error);
    throw new Error(error?.message || "Failed to setup client password");
  }
};

/**
 * Create a Supabase Auth user account for a client.
 * 
 * @param email - The client's email address
 * @param clientId - The client ID to store in user metadata
 * @param clientName - The client's name
 * @param agentName - The agent's name
 * @param agentDescription - The agent's description
 * @param tempPassword - The temporary password to set
 * @returns A promise that resolves to the result of the operation
 */
export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword: string
): Promise<any> => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call the edge function to create the user
    const { data, error } = await supabase.functions.invoke(
      'create-client-user',
      {
        body: {
          email,
          client_id: clientId,
          client_name: clientName,
          agent_name: agentName,
          agent_description: agentDescription,
          temp_password: tempPassword
        }
      }
    );
    
    if (error) {
      console.error('Error creating client user account:', error);
      throw new Error(error.message);
    }
    
    console.log('Client user account created successfully:', data);
    return data;
  } catch (err) {
    console.error('Failed to create client user account:', err);
    throw err;
  }
};

/**
 * Log client creation activity in the database.
 * 
 * @param clientId - The client ID 
 * @param clientName - The client's name
 * @param email - The client's email address
 * @param agentName - The agent's name
 * @returns A promise that resolves when the operation is complete
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "New agent created: " + agentName,
      metadata: {
        client_name: clientName,
        email: email,
        agent_name: agentName
      }
    });
    
    if (error) {
      console.error('Error logging client creation activity:', error);
      throw new Error(error.message);
    }
    
    console.log(`Agent creation activity logged for ${clientId}`);
  } catch (err) {
    console.error('Failed to log agent creation activity:', err);
    // Don't throw here - activity logging is not critical
  }
};
