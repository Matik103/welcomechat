
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

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
      .update(updateData)
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select('*')
      .single();

    if (error) {
      throw error;
    }

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
      widget_settings: data.settings || {},
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
