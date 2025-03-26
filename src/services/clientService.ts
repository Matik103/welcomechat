
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { getSettingsProp } from '@/utils/clientSettingsUtils';

/**
 * Create a new client
 */
export async function createClient(
  clientData: {
    client_name: string;
    email: string;
    company: string;
    description: string;
    agent_name?: string;
    status?: string;
  }
): Promise<{ id: string; client_id?: string }> {
  try {
    // Create the agent data
    const agentData = {
      client_name: clientData.client_name,
      email: clientData.email,
      company: clientData.company,
      description: clientData.description,
      name: clientData.agent_name || 'AI Assistant',
      interaction_type: 'config',
      status: clientData.status || 'active'
    };

    // Insert the new client
    const { data, error } = await supabase
      .from('ai_agents')
      .insert(agentData)
      .select()
      .single();

    if (error) throw error;
    return { id: data.id, client_id: data.client_id || data.id };
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

/**
 * Get a client by ID
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) throw error;
    
    if (!data) return null;

    // Convert Supabase Json type to standard Record<string, any>
    const widgetSettingsRecord: Record<string, any> = 
      typeof data.settings === 'object' && data.settings !== null
        ? { ...data.settings }
        : {};

    return {
      id: data.id,
      client_id: data.client_id || data.id,
      client_name: data.client_name || getSettingsProp(data.settings, 'client_name', ''),
      email: data.email || '',
      company: data.company || '',
      description: data.description || '',
      logo_url: data.logo_url || getSettingsProp(data.settings, 'logo_url', ''),
      logo_storage_path: data.logo_storage_path || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      deleted_at: data.deleted_at,
      deletion_scheduled_at: data.deletion_scheduled_at,
      last_active: data.last_active,
      status: data.status || 'active',
      agent_name: data.name || '',
      agent_description: data.agent_description || '',
      widget_settings: widgetSettingsRecord,
      name: data.name || '',
      is_error: !!data.is_error,
      user_id: data.user_id || ''
    };
  } catch (error) {
    console.error('Error getting client by ID:', error);
    throw error;
  }
}

/**
 * Get clients by email
 */
export async function getClientsByEmail(email: string): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('email', email)
      .eq('interaction_type', 'config');

    if (error) throw error;
    
    return (data || []).map(client => {
      // Convert Supabase Json type to standard Record<string, any>
      const widgetSettingsRecord: Record<string, any> = 
        typeof client.settings === 'object' && client.settings !== null
          ? { ...client.settings }
          : {};
          
      return {
        id: client.id,
        client_id: client.client_id || client.id,
        client_name: client.client_name || getSettingsProp(client.settings, 'client_name', ''),
        email: client.email || '',
        company: client.company || '',
        description: client.description || '',
        logo_url: client.logo_url || getSettingsProp(client.settings, 'logo_url', ''),
        logo_storage_path: client.logo_storage_path || '',
        created_at: client.created_at || '',
        updated_at: client.updated_at || '',
        deleted_at: client.deleted_at,
        deletion_scheduled_at: client.deletion_scheduled_at,
        last_active: client.last_active,
        status: client.status || 'active',
        agent_name: client.name || '',
        agent_description: client.agent_description || '',
        widget_settings: widgetSettingsRecord,
        name: client.name || '',
        is_error: !!client.is_error,
        user_id: client.user_id || ''
      };
    });
  } catch (error) {
    console.error('Error getting clients by email:', error);
    throw error;
  }
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  clientData: {
    client_name?: string;
    email?: string;
    company?: string;
    description?: string;
    agent_name?: string;
    status?: string;
    widget_settings?: Record<string, any>;
  }
): Promise<void> {
  try {
    const updateData: Record<string, any> = {};
    
    if (clientData.client_name) updateData.client_name = clientData.client_name;
    if (clientData.email) updateData.email = clientData.email;
    if (clientData.company) updateData.company = clientData.company;
    if (clientData.description) updateData.description = clientData.description;
    if (clientData.agent_name) updateData.name = clientData.agent_name;
    if (clientData.status) updateData.status = clientData.status;
    if (clientData.widget_settings) updateData.settings = clientData.widget_settings;
    
    const { error } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', clientId)
      .eq('interaction_type', 'config');

    if (error) throw error;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_scheduled_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('interaction_type', 'config');

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}
