
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';

interface ClientUpdateData {
  client_id: string;
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  status?: string;
  logo_url?: string;
}

// Get a client by ID
export async function getClient(clientId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
    
    // Adapt the data to match the Client interface
    const client: Client = {
      id: data.id,
      client_id: data.client_id || data.id,
      client_name: data.client_name || data.name,
      email: data.email || '',
      company: data.company || '',
      description: data.description || '',
      status: data.status || 'active',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      deleted_at: data.deleted_at || null,
      deletion_scheduled_at: data.deletion_scheduled_at || null,
      last_active: data.last_active || null,
      logo_url: data.logo_url || '',
      logo_storage_path: data.logo_storage_path || '',
      agent_name: data.name || '',
      agent_description: data.agent_description || '',
      widget_settings: data.widget_settings || {},
      name: data.client_name || data.name || '',
      is_error: data.is_error || false
    };
    
    return client;
  } catch (error) {
    console.error('Error in getClient:', error);
    throw error;
  }
}

// Update a client
export async function updateClient(data: ClientUpdateData) {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({
        client_name: data.client_name,
        email: data.email,
        company: data.company,
        description: data.description,
        status: data.status,
        logo_url: data.logo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.client_id);
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
    
    return { success: true, message: 'Client updated successfully' };
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
}

// Create a new client
export async function createClient(data: Omit<ClientUpdateData, 'client_id'>) {
  try {
    // Generate a unique client ID
    const clientId = crypto.randomUUID();
    
    const { data: newClient, error } = await supabase
      .from('ai_agents')
      .insert({
        id: clientId,
        client_id: clientId,
        client_name: data.client_name,
        name: data.client_name,
        email: data.email,
        company: data.company,
        description: data.description,
        status: data.status || 'active',
        logo_url: data.logo_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        interaction_type: 'config'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    return { 
      success: true, 
      message: 'Client created successfully',
      clientId: newClient.id
    };
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
}

// Mark a client as deleted
export async function deleteClient(clientId: string) {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('ai_agents')
      .update({
        deleted_at: now,
        updated_at: now,
        status: 'inactive'
      })
      .eq('id', clientId);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
    
    return { success: true, message: 'Client deleted successfully' };
  } catch (error) {
    console.error('Error in deleteClient:', error);
    throw error;
  }
}

// Recover a deleted client
export async function recoverClient(clientId: string) {
  try {
    const { error } = await supabase
      .from('ai_agents')
      .update({
        deleted_at: null,
        deletion_scheduled_at: null,
        updated_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', clientId);
    
    if (error) {
      console.error('Error recovering client:', error);
      throw error;
    }
    
    return { success: true, message: 'Client recovered successfully' };
  } catch (error) {
    console.error('Error in recoverClient:', error);
    throw error;
  }
}
