
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Get all clients
 */
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('interaction_type', 'config')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    // Transform the data into the expected Client type
    const clients: Client[] = data.map(agent => ({
      client_id: agent.client_id || agent.id,
      user_id: agent.user_id || '',
      client_name: (agent.settings?.client_name as string) || '',
      email: (agent.settings?.email as string) || '',
      created_at: agent.created_at,
      widget_settings: {
        agent_name: agent.name || 'AI Assistant',
        agent_description: (agent.settings?.agent_description as string) || '',
        logo_url: (agent.settings?.logo_url as string) || '',
        logo_storage_path: (agent.settings?.logo_storage_path as string) || '',
      }
    }));

    return clients;
  } catch (error) {
    console.error('Error in getClients:', error);
    throw error;
  }
};

/**
 * Get a client by ID
 */
export const getClient = async (clientId: string): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      throw error;
    }

    // Transform the data into the expected Client type
    const client: Client = {
      client_id: data.client_id || data.id,
      user_id: data.user_id || '',
      client_name: (data.settings?.client_name as string) || '',
      email: (data.settings?.email as string) || '',
      created_at: data.created_at,
      widget_settings: {
        agent_name: data.name || 'AI Assistant',
        agent_description: (data.settings?.agent_description as string) || '',
        logo_url: (data.settings?.logo_url as string) || '',
        logo_storage_path: (data.settings?.logo_storage_path as string) || '',
      }
    };

    return client;
  } catch (error) {
    console.error(`Error in getClient for ${clientId}:`, error);
    throw error;
  }
};

/**
 * Create a new client
 */
export const createNewClient = async (client: Partial<Client>): Promise<Client> => {
  try {
    // Generate a UUID for the client
    const clientId = crypto.randomUUID();
    
    // Create the client record in the ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        id: clientId,
        client_id: clientId,
        user_id: client.user_id || '',
        name: 'AI Assistant',
        interaction_type: 'config',
        status: 'active',
        settings: {
          client_name: client.client_name,
          email: client.email,
          created_at: new Date().toISOString()
        },
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
    await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'client_created',
      description_param: `New client created: ${client.client_name}`,
      metadata_param: {
        email: client.email,
        created_at: new Date().toISOString()
      }
    });
    
    // Return the created client
    return {
      client_id: clientId,
      user_id: client.user_id || '',
      client_name: client.client_name || '',
      email: client.email || '',
      created_at: new Date().toISOString(),
      widget_settings: {
        agent_name: 'AI Assistant',
        agent_description: '',
        logo_url: '',
        logo_storage_path: ''
      }
    };
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (client: Partial<Client>): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        settings: {
          client_name: client.client_name,
          email: client.email,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('client_id', client.client_id)
      .eq('interaction_type', 'config')
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating client ${client.client_id}:`, error);
      throw error;
    }
    
    // Return the updated client
    return {
      client_id: client.client_id || '',
      user_id: data.user_id || '',
      client_name: client.client_name || '',
      email: client.email || '',
      created_at: data.created_at,
      widget_settings: {
        agent_name: data.name || 'AI Assistant',
        agent_description: (data.settings?.agent_description as string) || '',
        logo_url: (data.settings?.logo_url as string) || '',
        logo_storage_path: (data.settings?.logo_storage_path as string) || ''
      }
    };
  } catch (error) {
    console.error(`Error in updateClient for ${client.client_id}:`, error);
    throw error;
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    // Instead of actually deleting, mark the client as deleted
    const { error } = await supabase
      .from('ai_agents')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
        settings: supabase.rpc('jsonb_set', {
          jsonb: supabase.rpc('get_settings', { agent_id: clientId }),
          path: '{deleted_at}',
          value: JSON.stringify(new Date().toISOString())
        })
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (error) {
      console.error(`Error deleting client ${clientId}:`, error);
      throw error;
    }
    
    // Log client deletion activity
    await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'client_deleted',
      description_param: `Client deleted: ${clientId}`,
      metadata_param: {
        deleted_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error in deleteClient for ${clientId}:`, error);
    throw error;
  }
};
