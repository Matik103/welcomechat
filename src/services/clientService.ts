
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';

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
