
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from './clientActivityService';
import { Client } from '@/types/client';
import { ActivityType } from '@/types/client-form';
import { updateWidgetSettings } from './widgetSettingsService';
import { Json } from '@/integrations/supabase/types';
import { execSql } from '@/utils/rpcUtils';

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
      id: item.client_id || '',
      client_id: item.client_id || '',
      client_name: item.client_name || '',
      email: item.email || '',
      company: item.company || '',
      status: item.status || 'active',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      deleted_at: item.deleted_at || null,
      deletion_scheduled_at: item.deletion_scheduled_at || null,
      last_active: item.last_active || null,
      logo_url: item.logo_url || '',
      logo_storage_path: item.logo_storage_path || '',
      agent_name: item.name || 'AI Assistant',
      agent_description: item.agent_description || '',
      widget_settings: item.settings as Record<string, any> || {},
      description: ''
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
      id: data.client_id || '',
      client_id: data.client_id || '',
      client_name: data.client_name || '',
      email: data.email || '',
      company: data.company || '',
      status: data.status || 'active',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      deleted_at: data.deleted_at || null,
      deletion_scheduled_at: data.deletion_scheduled_at || null,
      last_active: data.last_active || null,
      logo_url: data.logo_url || '',
      logo_storage_path: data.logo_storage_path || '',
      agent_name: data.name || 'AI Assistant',
      agent_description: data.agent_description || '',
      widget_settings: data.settings as Record<string, any> || {},
      description: ''
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
    await createClientActivity('client_created', `Client created: ${clientData.client_name}`, {
      client_id: clientId,
      email: clientData.email
    });
    
    // Return the new client object
    const client: Client = {
      id: clientId,
      client_id: clientId,
      client_name: clientData.client_name,
      email: clientData.email,
      company: '',
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
      description: ''
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
    await execSql(`
      SELECT log_client_activity(
        $1,
        $2,
        $3,
        $4
      )
    `, [clientId, 'client_updated', description, JSON.stringify(metadata || {})]);
  } catch (error) {
    console.error(`Error logging client update activity for ${clientId}:`, error);
  }
};
