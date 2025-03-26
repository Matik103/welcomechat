import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from './clientActivityService';
import { Client } from '@/types/client';
import { ActivityType } from '@/types/client-form';
import { updateWidgetSettings } from './widgetSettingsService';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

// Get all clients
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('interaction_type', 'config');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    // Map the ai_agents data to Client interface
    const clients: Client[] = (data || []).map(item => ({
      id: String(item.id || ''),
      client_id: String(item.client_id || ''),
      client_name: String(item.client_name || ''),
      email: String(item.email || ''),
      company: String(item.company || ''),
      status: String(item.status || 'active'),
      created_at: String(item.created_at || new Date().toISOString()),
      updated_at: String(item.updated_at || new Date().toISOString()),
      deleted_at: item.deleted_at || null,
      deletion_scheduled_at: item.deletion_scheduled_at || null,
      last_active: item.last_active || null,
      logo_url: String(item.logo_url || ''),
      logo_storage_path: String(item.logo_storage_path || ''),
      agent_name: String(item.name || 'AI Assistant'),
      agent_description: String(item.agent_description || ''),
      widget_settings: typeof item.settings === 'object' ? item.settings : {},
      description: String(item.description || ''),
      user_id: String(item.client_id || '') // Use client_id as user_id
    }));

    return clients;
  } catch (error) {
    console.error('Error in getAllClients:', error);
    throw error;
  }
};

// Get client by ID
export const getClient = async (clientId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      return null;
    }

    if (!data) return null;

    // Convert ai_agents record to Client interface
    const client: Client = {
      id: String(data.id || ''),
      client_id: String(data.client_id || ''),
      client_name: String(data.client_name || ''),
      email: String(data.email || ''),
      company: String(data.company || ''),
      status: String(data.status || 'active'),
      created_at: String(data.created_at || new Date().toISOString()),
      updated_at: String(data.updated_at || new Date().toISOString()),
      deleted_at: data.deleted_at || null,
      deletion_scheduled_at: data.deletion_scheduled_at || null,
      last_active: data.last_active || null,
      logo_url: String(data.logo_url || ''),
      logo_storage_path: String(data.logo_storage_path || ''),
      agent_name: String(data.name || 'AI Assistant'),
      agent_description: String(data.agent_description || ''),
      widget_settings: typeof data.settings === 'object' ? data.settings : {},
      description: String(data.description || ''),
      user_id: String(data.user_id || '')
    };

    return client;
  } catch (error) {
    console.error(`Error in getClient for ${clientId}:`, error);
    return null;
  }
};

// Create a new client
export const createNewClient = async (clientData: {
  client_name: string;
  email: string;
  agent_name?: string;
  logo_url?: string;
  logo_storage_path?: string;
  widget_settings?: Record<string, any>;
}): Promise<Client> => {
  try {
    // Create a new client ID if not provided
    const clientId = crypto.randomUUID();
    
    // Prepare default widget settings if not provided
    const widgetSettings = clientData.widget_settings || {
      agent_name: clientData.agent_name || 'AI Assistant',
      agent_description: '',
      logo_url: clientData.logo_url || '',
      logo_storage_path: clientData.logo_storage_path || ''
    };
    
    // Insert the new client
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        client_name: clientData.client_name,
        email: clientData.email,
        name: clientData.agent_name || 'AI Assistant',
        settings: widgetSettings,
        interaction_type: 'config',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    // Log client creation activity
    await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'client_created',
      description_param: `Client created: ${clientData.client_name}`,
      metadata_param: {
        client_id: clientId,
        email: clientData.email
      }
    });
    
    // Return the new client object
    const client: Client = {
      id: clientId,
      client_id: clientId,
      client_name: clientData.client_name,
      email: clientData.email,
      company: '',
      description: '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      deletion_scheduled_at: null,
      last_active: null,
      logo_url: clientData.logo_url || '',
      logo_storage_path: clientData.logo_storage_path || '',
      agent_name: clientData.agent_name || 'AI Assistant',
      agent_description: '',
      widget_settings: widgetSettings,
      user_id: clientId // Use clientId as user_id
    };
    
    return client;
  } catch (error) {
    console.error('Error in createNewClient:', error);
    throw error;
  }
};

// Update an existing client
export const updateClient = async (clientData: {
  client_id: string;
  client_name: string;
  email: string;
  agent_name?: string;
  logo_url?: string;
  logo_storage_path?: string;
}): Promise<Client> => {
  try {
    // Update the client record
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        client_name: clientData.client_name,
        email: clientData.email,
        name: clientData.agent_name,
        logo_url: clientData.logo_url,
        logo_storage_path: clientData.logo_storage_path,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientData.client_id)
      .eq('interaction_type', 'config')
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating client ${clientData.client_id}:`, error);
      throw error;
    }
    
    // Get the current client to return
    const updatedClient = await getClient(clientData.client_id);
    
    if (!updatedClient) {
      throw new Error(`Client not found after update: ${clientData.client_id}`);
    }
    
    return updatedClient;
  } catch (error) {
    console.error(`Error in updateClient for ${clientData.client_id}:`, error);
    throw error;
  }
};

// Log client update activity
export const logClientUpdateActivity = async (
  clientId: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Use safe SQL execution
    await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'client_updated',
      description_param: description,
      metadata_param: metadata || {}
    });
  } catch (error) {
    console.error(`Error logging client update activity for ${clientId}:`, error);
  }
};
