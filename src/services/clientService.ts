import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Fetches all clients from the database
 * @returns Promise that resolves to an array of clients
 */
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const { data: clients, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq('interaction_type', 'config');

    if (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }

    return clients || [];
  } catch (error) {
    console.error("Error in getAllClients:", error);
    throw error;
  }
};

/**
 * Fetches a single client from the database by ID
 * @param id The ID of the client to fetch
 * @returns Promise that resolves to a client object, or null if not found
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data: client, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("client_id", id)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      // If no client is found, the error will have a specific message
      if (error.message.includes('No rows found')) {
        return null;
      }
      console.error("Error fetching client by ID:", error);
      throw error;
    }

    return client || null;
  } catch (error) {
    console.error("Error in getClientById:", error);
    throw error;
  }
};

/**
 * Creates a new client using the RPC function
 */
export const createNewClient = async (
  clientName: string, 
  email: string, 
  agentName?: string,
  logoUrl?: string,
  logoStoragePath?: string,
  widgetSettings?: any
): Promise<string> => {
  try {
    const clientId = await callRpcFunction('create_new_client', {
      p_client_name: clientName,
      p_email: email,
      p_agent_name: agentName,
      p_logo_url: logoUrl,
      p_logo_storage_path: logoStoragePath,
      p_widget_settings: widgetSettings
    });
    
    // Log client creation activity using the clientId returned from the RPC
    if (clientId) {
      // Use callRpcFunction for activity logging to avoid type checking issues
      await callRpcFunction('log_client_activity', {
        client_id_param: clientId,
        activity_type_param: 'client_created',
        description_param: `New client created: ${clientName}`,
        metadata_param: {
          email,
          agent_name: agentName
        }
      });
    }
    
    return clientId;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

/**
 * Updates an existing client in the database
 * @param id The ID of the client to update
 * @param updates An object containing the fields to update
 * @returns Promise that resolves when the client is updated
 */
export const updateClient = async (
  id: string,
  updates: Partial<Client>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("ai_agents")
      .update(updates)
      .eq("client_id", id)
      .eq('interaction_type', 'config');

    if (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateClient:", error);
    throw error;
  }
};

/**
 * Deletes a client from the database
 * @param id The ID of the client to delete
 * @returns Promise that resolves when the client is deleted
 */
export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("client_id", id)
      .eq('interaction_type', 'config');

    if (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteClient:", error);
    throw error;
  }
};
