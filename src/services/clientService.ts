
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { JsonObject } from "@/types/supabase-extensions";

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

    // First, verify if the client exists before attempting to update
    const { data: existingClient, error: findError } = await supabase
      .from('ai_agents')
      .select('id, client_id, interaction_type')
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .eq('interaction_type', 'config')
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding client:", findError);
      throw findError;
    }

    if (!existingClient) {
      // Try a more explicit query if the first one didn't work
      const { data: explicitClient } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT id, client_id FROM ai_agents
            WHERE (id::text = $1 OR client_id::text = $1) 
            AND interaction_type = 'config'
            LIMIT 1
          `,
          query_params: [clientId]
        }
      );

      if (!explicitClient || explicitClient.length === 0) {
        throw new Error(`No client found with ID or client_id: ${clientId}`);
      }
    }

    // Create an object for the settings to update
    const settingsToUpdate = {
      agent_name: updateData.agent_name,
      agent_description: updateData.agent_description,
      logo_url: updateData.logo_url,
      logo_storage_path: updateData.logo_storage_path
    };

    // Try updating by ID first
    let { data, error } = await supabase
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
      .eq('id', clientId)
      .eq('interaction_type', 'config')
      .select('*')
      .maybeSingle();

    // If no rows found by ID or error occurred, try by client_id
    if (!data || error) {
      console.log("No rows found by ID or error occurred, trying client_id");
      const { data: clientData, error: clientError } = await supabase
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
        .select('*')
        .maybeSingle();

      if (clientError) {
        console.error("Error updating client by client_id:", clientError);
        throw clientError;
      }
      data = clientData;
    }

    // If we still don't have data, throw an error
    if (!data) {
      throw new Error(`Failed to update client with ID or client_id: ${clientId}`);
    }

    // Update the settings with an RPC call to safely merge JSON
    const { error: settingsError } = await supabase.rpc(
      'exec_sql',
      {
        sql_query: `
          UPDATE ai_agents
          SET settings = settings || $1::jsonb
          WHERE (id = $2 OR client_id = $2) AND interaction_type = 'config'
        `,
        query_params: [JSON.stringify(settingsToUpdate), clientId]
      }
    );

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
      // Don't throw here, as the basic update succeeded
    }

    // Ensure widget_settings is always treated as an object
    const widgetSettings = data.settings ? 
      (typeof data.settings === 'object' ? data.settings : {}) : 
      {};
    
    return {
      id: data.id,
      client_id: data.client_id || '',
      client_name: data.client_name || '',
      email: data.email || '',
      status: data.status as 'active' | 'inactive' | 'deleted' || 'active',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      agent_name: data.name || '',
      agent_description: data.agent_description || '',
      logo_url: data.logo_url || '',
      widget_settings: widgetSettings as Record<string, any>,
      user_id: '',
      company: data.company || '',
      description: data.description || '',
      logo_storage_path: data.logo_storage_path || '',
      deletion_scheduled_at: data.deletion_scheduled_at || null,
      deleted_at: data.deleted_at || null,
      last_active: data.last_active || null,
      name: data.name || '',
      is_error: data.is_error || false
    };
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};
