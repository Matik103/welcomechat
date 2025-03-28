
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
    // Check if we need to update the ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        ...updateData,
        // Update widget settings with the logo information
        settings: supabase.rpc('jsonb_merge', {
          source: { 
            agent_name: updateData.agent_name,
            agent_description: updateData.agent_description,
            logo_url: updateData.logo_url,
            logo_storage_path: updateData.logo_storage_path
          }
        })
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select('*')
      .single();

    if (error) {
      throw error;
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
