import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";
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

    // First, try to find the client by id directly
    let { data: clientRecordResult, error: findError } = await supabaseAdmin
      .from('ai_agents')
      .select('id, client_id')
      .eq('id', clientId)
      .eq('interaction_type', 'config')
      .limit(1)
      .maybeSingle();

    // If not found by id, try by client_id
    if (!clientRecordResult && !findError) {
      const { data: altResult, error: altError } = await supabaseAdmin
        .from('ai_agents')
        .select('id, client_id')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
        
      clientRecordResult = altResult;
      findError = altError;
    }

    if (findError) {
      console.error("Error finding client:", findError);
      throw new Error(`Failed to find client: ${findError.message}`);
    }

    if (!clientRecordResult) {
      throw new Error(`No client found with ID or client_id: ${clientId}`);
    }

    // Get the first row from the result
    const clientRecord = clientRecordResult;
    console.log("Found client record:", clientRecord);
    
    // Always use 'id' for the update query since we have confirmed the record exists
    const recordId = clientRecord.id;

    // Create an object for the settings to update
    const settingsToUpdate = {
      agent_name: updateData.agent_name,
      agent_description: updateData.agent_description,
      logo_url: updateData.logo_url,
      logo_storage_path: updateData.logo_storage_path,
      client_name: updateData.client_name,
      email: updateData.email
    };

    // Update the main record
    const { data: updateResult, error: updateError } = await supabaseAdmin
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
      .eq('id', recordId)
      .eq('interaction_type', 'config')
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error(`Error updating client by id:`, updateError);
      throw new Error(`Failed to update client: ${updateError.message}`);
    }

    if (!updateResult) {
      throw new Error(`Failed to update client with id: ${recordId}`);
    }

    // Update the settings with an RPC call to safely merge JSON
    const { error: settingsError } = await supabaseAdmin.rpc(
      'exec_sql',
      {
        sql_query: `
          WITH settings_json AS (
            SELECT $1::text::jsonb as new_settings
          )
          UPDATE ai_agents
          SET settings = COALESCE(settings, '{}'::jsonb) || (SELECT new_settings FROM settings_json)
          WHERE id = '${recordId}' AND interaction_type = 'config'
          RETURNING settings;
        `,
        query_params: [JSON.stringify(settingsToUpdate)]
      }
    );

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
      // Don't throw here, as the basic update succeeded
    }

    // Ensure widget_settings is always treated as an object
    const widgetSettings = updateResult.settings ? 
      (typeof updateResult.settings === 'object' ? updateResult.settings : {}) : 
      {};
    
    // Create an activity record for the update using admin client
    const { error: activityError } = await supabaseAdmin
      .from('activities')
      .insert({
        ai_agent_id: updateResult.id,
        type: 'client_updated',
        description: `Client updated: ${updateData.client_name}`,
        metadata: {
          client_name: updateData.client_name,
          email: updateData.email,
          agent_name: updateData.agent_name
        }
      });

    if (activityError) {
      console.error("Error creating activity record:", activityError);
      // Don't throw here as the main update succeeded
    }

    return {
      id: updateResult.id,
      client_id: updateResult.client_id || '',
      client_name: updateResult.client_name || '',
      email: updateResult.email || '',
      status: updateResult.status as 'active' | 'inactive' | 'deleted' || 'active',
      created_at: updateResult.created_at || '',
      updated_at: updateResult.updated_at || '',
      agent_name: updateResult.name || '',
      agent_description: updateResult.agent_description || '',
      logo_url: updateResult.logo_url || '',
      widget_settings: widgetSettings as Record<string, any>,
      user_id: '',
      company: updateResult.company || '',
      description: updateResult.description || '',
      logo_storage_path: updateResult.logo_storage_path || '',
      deletion_scheduled_at: updateResult.deletion_scheduled_at || null,
      deleted_at: updateResult.deleted_at || null,
      last_active: updateResult.last_active || null,
      name: updateResult.name || '',
      is_error: updateResult.is_error || false
    };
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};
