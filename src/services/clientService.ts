
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { JsonObject } from "@/types/supabase-extensions";
import { callRpcFunctionSafe } from "@/utils/rpcUtils";

/**
 * Get the count of active clients
 * @returns Object containing total clients count and active clients count
 */
export const getActiveClientsCount = async (): Promise<{ total: number, active: number }> => {
  try {
    // Get all non-deleted clients
    const { count: totalCount, error: countError } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null);
      
    if (countError) throw countError;
    
    // Get active clients (those with recent activity in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    
    const { data: activeClientsData, error: activeError } = await supabase
      .from('ai_agents')
      .select('client_id, last_active')
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('last_active', timeAgo.toISOString());
      
    if (activeError) throw activeError;
    
    // Count unique client IDs with recent activity
    const uniqueClientIds = new Set();
    activeClientsData?.forEach(item => {
      if (item.client_id) uniqueClientIds.add(item.client_id);
    });
    
    return {
      total: totalCount || 0,
      active: uniqueClientIds.size
    };
  } catch (error) {
    console.error("Error getting active clients count:", error);
    return { total: 0, active: 0 };
  }
};

/**
 * Update a client with new data
 * @param clientId The ID of the client to update
 * @param updateData The data to update the client with
 * @returns The updated client
 */
export const updateClient = async (clientId: string, updateData: Partial<Client>): Promise<Client> => {
  if (!clientId) {
    throw new Error("Client ID is required");
  }

  try {
    console.log("Updating client with ID:", clientId);
    console.log("Update data:", JSON.stringify(updateData));

    // First check if the client exists
    const { data: existingClients, error: checkError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (checkError) {
      console.error("Error finding client:", checkError);
      throw new Error(`Client not found: ${checkError.message}`);
    }
    
    if (!existingClients || existingClients.length === 0) {
      throw new Error(`No client found with ID: ${clientId}`);
    }
    
    // Use the first client record if multiple exist
    const existingClient = existingClients[0];

    // Create an object for the settings to update
    const settingsToUpdate = {
      agent_name: updateData.agent_name,
      agent_description: updateData.agent_description,
      logo_url: updateData.logo_url,
      logo_storage_path: updateData.logo_storage_path
    };

    // Update both the client record and the settings JSON in a transaction
    try {
      // Use our callRpcFunctionSafe utility which has proper typing
      const result = await callRpcFunctionSafe<boolean>('update_client_with_settings', {
        p_client_id: clientId,
        p_client_name: updateData.client_name,
        p_email: updateData.email,
        p_agent_name: updateData.agent_name,
        p_agent_description: updateData.agent_description,
        p_logo_url: updateData.logo_url,
        p_logo_storage_path: updateData.logo_storage_path,
        p_settings: settingsToUpdate
      });

      if (!result) {
        throw new Error("RPC function returned false");
      }
      
      // If RPC succeeded, fetch the updated client, but don't use .single()
      const { data: updatedClients, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
        
      if (fetchError) {
        console.error("Error fetching updated client:", fetchError);
        throw fetchError;
      }
      
      if (!updatedClients || updatedClients.length === 0) {
        throw new Error("Client was updated but could not be retrieved");
      }
      
      return mapAgentToClient(updatedClients[0]);
    } catch (error) {
      console.error("Error with RPC call:", error);
      
      // Fall back to direct update if RPC fails
      console.log("Falling back to direct update method");
      
      // Update the client record directly with the new data
      const { data: updatedClients, error: updateError } = await supabase
        .from('ai_agents')
        .update({
          client_name: updateData.client_name,
          email: updateData.email,
          name: updateData.agent_name,
          agent_description: updateData.agent_description,
          logo_url: updateData.logo_url,
          logo_storage_path: updateData.logo_storage_path,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .select();

      if (updateError) {
        console.error("Error updating client basic info:", updateError);
        throw updateError;
      }
      
      if (!updatedClients || updatedClients.length === 0) {
        throw new Error("No client was updated");
      }
      
      // Update settings separately
      const settings = existingClient.settings || {};
      const mergedSettings = {
        ...(typeof settings === 'object' ? settings : {}),
        ...settingsToUpdate
      };
      
      const { error: settingsError } = await supabase
        .from('ai_agents')
        .update({ settings: mergedSettings })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
        
      if (settingsError) {
        console.error("Error updating settings:", settingsError);
        // Don't throw here, as we already updated the basic client info
      }
      
      return mapAgentToClient(updatedClients[0]);
    }
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

// Helper function to map database agent to Client type
function mapAgentToClient(agent: any): Client {
  if (!agent) throw new Error("No agent data provided");
  
  // Ensure settings is always an object
  const settings = agent.settings || {};
  const widgetSettings = typeof settings === 'object' ? settings : {};
  
  return {
    id: agent.id,
    client_id: agent.client_id || '',
    client_name: agent.client_name || '',
    email: agent.email || '',
    company: agent.company || '',
    description: agent.description || '',
    status: agent.status as 'active' | 'inactive' | 'deleted' || 'active',
    created_at: agent.created_at || '',
    updated_at: agent.updated_at || '',
    deletion_scheduled_at: agent.deletion_scheduled_at || null,
    deleted_at: agent.deleted_at || null,
    last_active: agent.last_active || null,
    logo_url: agent.logo_url || '',
    logo_storage_path: agent.logo_storage_path || '',
    agent_name: agent.name || '',
    agent_description: agent.agent_description || '',
    widget_settings: widgetSettings,
    name: agent.name || '',
    is_error: agent.is_error || false,
    user_id: agent.user_id || ''
  };
}
