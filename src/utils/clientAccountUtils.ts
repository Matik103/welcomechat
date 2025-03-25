import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";

/**
 * Creates a new client account
 * @param formData The client form data
 * @returns The result of the operation
 */
export const createClientAccount = async (formData: any): Promise<{
  success: boolean;
  message: string;
  clientId?: string;
}> => {
  try {
    console.log("Creating client with data:", formData);
    
    // Create the client/agent in ai_agents table
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .insert({
        client_name: formData.client_name,
        email: formData.email,
        company: formData.company || null,
        name: formData.bot_settings?.bot_name || "AI Assistant",
        agent_description: formData.bot_settings?.bot_personality || "",
        content: "",
        interaction_type: 'config',
        status: 'active',
        settings: {
          agent_name: formData.bot_settings?.bot_name || "AI Assistant",
          agent_description: formData.bot_settings?.bot_personality || "",
          logo_url: "",
          client_name: formData.client_name,
          email: formData.email,
          company: formData.company || null
        }
      })
      .select()
      .single();
    
    if (clientError) {
      console.error("Error creating client:", clientError);
      return {
        success: false,
        message: `Failed to create client: ${clientError.message}`
      };
    }
    
    console.log("Client created successfully:", clientData);
    
    // Log the client creation activity
    await createActivityDirect(
      clientData.id,
      'client_created' as ActivityType,
      `Client ${formData.client_name} created`,
      {
        email: formData.email,
        company: formData.company,
        agent_name: formData.bot_settings?.bot_name || "AI Assistant"
      }
    );
    
    return {
      success: true,
      message: "Client created successfully",
      clientId: clientData.id
    };
  } catch (error) {
    console.error("Error in createClientAccount:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Updates an existing client account
 * @param clientId The client ID
 * @param formData The client form data
 * @returns The result of the operation
 */
export const updateClientAccount = async (clientId: string, formData: any): Promise<{
  success: boolean;
  message: string;
  clientData?: any;
}> => {
  try {
    console.log(`Updating client ${clientId} with data:`, formData);
    
    // Update the client/agent in ai_agents table
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .update({
        client_name: formData.client_name,
        email: formData.email,
        company: formData.company || null,
        name: formData.bot_settings?.bot_name || "AI Assistant",
        agent_description: formData.bot_settings?.bot_personality || "",
        settings: {
          agent_name: formData.bot_settings?.bot_name || "AI Assistant",
          agent_description: formData.bot_settings?.bot_personality || "",
          logo_url: "",
          client_name: formData.client_name,
          email: formData.email,
          company: formData.company || null
        }
      })
      .eq('id', clientId)
      .select()
      .single();
    
    if (clientError) {
      console.error("Error updating client:", clientError);
      return {
        success: false,
        message: `Failed to update client: ${clientError.message}`
      };
    }
    
    console.log("Client updated successfully:", clientData);
    
    // Log the client update activity
    await createActivityDirect(
      clientId,
      'client_updated' as ActivityType,
      `Client ${formData.client_name} updated`,
      {
        email: formData.email,
        company: formData.company,
        agent_name: formData.bot_settings?.bot_name || "AI Assistant"
      }
    );
    
    return {
      success: true,
      message: "Client updated successfully",
      clientData: clientData
    };
  } catch (error) {
    console.error("Error in updateClientAccount:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Deletes a client account
 * @param clientId The client ID
 * @returns The result of the operation
 */
export const deleteClientAccount = async (clientId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log(`Deleting client ${clientId}`);
    
    // Delete the client/agent from ai_agents table
    const { error: clientError } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', clientId);
    
    if (clientError) {
      console.error("Error deleting client:", clientError);
      return {
        success: false,
        message: `Failed to delete client: ${clientError.message}`
      };
    }
    
    console.log("Client deleted successfully");
    
    // Log the client deletion activity
    await createActivityDirect(
      clientId,
      'client_deleted' as ActivityType,
      `Client ${clientId} deleted`,
      {}
    );
    
    return {
      success: true,
      message: "Client deleted successfully"
    };
  } catch (error) {
    console.error("Error in deleteClientAccount:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Retrieves a client account by ID
 * @param clientId The client ID
 * @returns The client account data or null if not found
 */
export const getClientAccount = async (clientId: string): Promise<any | null> => {
  try {
    console.log(`Retrieving client ${clientId}`);
    
    // Retrieve the client/agent from ai_agents table
    const { data: clientData, error: clientError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error("Error retrieving client:", clientError);
      return null;
    }
    
    console.log("Client retrieved successfully:", clientData);
    return clientData;
  } catch (error) {
    console.error("Error in getClientAccount:", error);
    return null;
  }
};

/**
 * Set up a temporary password for a client
 * @param clientId The client ID
 * @param email The client email
 * @returns The temporary password
 */
export const setupClientPassword = async (clientId: string, email: string): Promise<string> => {
  try {
    // Generate a secure temporary password
    const tempPassword = generateTempPassword();
    
    // Save the temporary password
    await saveClientTempPassword(clientId, email, tempPassword);
    
    return tempPassword;
  } catch (error) {
    console.error("Error setting up client password:", error);
    throw new Error(`Failed to set up client password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Creates a user account for a client
 * @param email Client email
 * @param clientId Client ID
 * @param clientName Client name
 * @param agentName Agent name
 * @param agentDescription Agent description
 * @param tempPassword Temporary password
 * @returns The result of the operation
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
    console.log(`Creating user account for client ${clientId} with email ${email}`);
    
    // Call the edge function to create a user account
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
      console.error("Error creating client user account:", error);
      throw new Error(error.message);
    }
    
    console.log("Client user account created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createClientUserAccount:", error);
    throw new Error(`Failed to create client user account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Logs a client creation activity
 * @param clientId Client ID
 * @param clientName Client name
 * @param email Client email
 * @param agentName Agent name
 * @returns The result of the operation
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<any> => {
  try {
    console.log(`Logging client creation activity for ${clientId}`);
    
    // Use the createActivityDirect function
    return await createActivityDirect(
      clientId,
      'client_created' as ActivityType,
      `Client ${clientName} created`,
      {
        email,
        agent_name: agentName
      }
    );
  } catch (error) {
    console.error("Error logging client creation activity:", error);
    return null;
  }
};
