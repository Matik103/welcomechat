
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { ClientFormData } from '@/types/client-form';
import { safeParseSettings } from '@/utils/clientSettingsUtils';

export interface CreateClientData {
  client_name: string;
  email: string;
  company?: string;
  description?: string;
}

export interface UpdateClientData {
  client_id: string;
  client_name?: string;
  email?: string;
  company?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'deleted';
}

export async function createClient(data: CreateClientData): Promise<Client> {
  try {
    // Insert into ai_agents table
    const { data: newClient, error } = await supabase
      .from('ai_agents')
      .insert({
        name: data.client_name, // Add name field required by the database
        client_name: data.client_name,
        email: data.email,
        company: data.company || '',
        description: data.description || '',
        interaction_type: 'config',
        status: 'active',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Map to Client type
    const settings = safeParseSettings(newClient.settings);

    return {
      id: newClient.id,
      client_id: newClient.client_id || newClient.id,
      user_id: '', // Default value since it's missing in the response
      client_name: newClient.client_name,
      email: newClient.email,
      company: newClient.company || '',
      description: newClient.description || '',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
      created_at: newClient.created_at,
      updated_at: newClient.updated_at,
      deleted_at: newClient.deleted_at,
      deletion_scheduled_at: newClient.deletion_scheduled_at,
      last_active: newClient.last_active,
      agent_name: settings.agent_name || newClient.name || '',
      agent_description: settings.agent_description || '',
      widget_settings: settings,
      name: newClient.name || '',
      status: newClient.status || 'active',
      is_error: false
    };
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function updateClient(data: UpdateClientData): Promise<Client> {
  try {
    const { data: updatedClient, error } = await supabase
      .from('ai_agents')
      .update({
        name: data.client_name, // Add name field required by DB
        client_name: data.client_name,
        email: data.email,
        company: data.company,
        description: data.description,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.client_id)
      .select('*')
      .single();

    if (error) throw error;
    
    // Map to Client type
    const settings = safeParseSettings(updatedClient.settings);
    
    return {
      id: updatedClient.id,
      client_id: updatedClient.client_id || updatedClient.id,
      user_id: '', // Default value since it's missing in the response
      client_name: updatedClient.client_name,
      email: updatedClient.email,
      company: updatedClient.company || '',
      description: updatedClient.description || '',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
      created_at: updatedClient.created_at,
      updated_at: updatedClient.updated_at,
      deleted_at: updatedClient.deleted_at,
      deletion_scheduled_at: updatedClient.deletion_scheduled_at,
      last_active: updatedClient.last_active,
      agent_name: settings.agent_name || updatedClient.name || '',
      agent_description: settings.agent_description || '',
      widget_settings: settings,
      name: updatedClient.name || '',
      status: updatedClient.status || 'active',
      is_error: false
    };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}
