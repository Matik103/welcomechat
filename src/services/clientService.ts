import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new client
 */
export const createClient = async (clientData: {
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  agent_name?: string;
}): Promise<Client | null> => {
  try {
    // Generate a client ID (UUID)
    const clientId = uuidv4();
    
    // Prepare the client data with defaults
    const newClient = {
      id: clientId,
      client_id: clientId,
      client_name: clientData.client_name,
      email: clientData.email,
      company: clientData.company || '',
      agent_description: clientData.description || '',
      name: clientData.agent_name || 'AI Assistant',
      interaction_type: 'config',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      settings: {
        client_name: clientData.client_name,
        email: clientData.email
      }
    };
    
    // Insert the client into the database
    const { data, error } = await supabase
      .from('ai_agents')
      .insert(newClient)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client: ' + error.message);
      return null;
    }
    
    // Log the activity using console instead of database
    console.log(`[ACTIVITY LOG]: Client created: ${clientData.client_name}`, {
      action: 'client_created',
      client_name: clientData.client_name,
      email: clientData.email,
      timestamp: new Date().toISOString()
    });
    
    return data as Client;
  } catch (error) {
    console.error('Error in createClient:', error);
    toast.error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

export const getClient = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    return data as unknown as Client;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

// Alias for backward compatibility
export const getClientById = getClient;

export const getClients = async () => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as unknown as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const getClientByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data as unknown as Client;
  } catch (error) {
    console.error('Error fetching client by email:', error);
    return null;
  }
};

export const updateClient = async (clientId: string, updates: Partial<Client>) => {
  try {
    // Log the action using a generic term to avoid activity_type references
    console.log(`[Client Action]: Updating client ${updates.client_name || clientId}`, {
      action: 'update',
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase
      .from('ai_agents')
      .update(updates as any)
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    return data as unknown as Client;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (clientId: string) => {
  try {
    // Log the action using a generic term to avoid activity_type references
    console.log(`[Client Action]: Deleting client ${clientId}`, {
      action: 'delete',
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', clientId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
