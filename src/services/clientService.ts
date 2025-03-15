
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientAgent } from "@/types/client";
import { toast } from "sonner";

// Function to create a client
export const createClient = async (clientData: Omit<Client, 'id'>): Promise<{ client: Client | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    
    // Return the created client
    return { client: data as Client, error: null };
  } catch (error) {
    console.error('Error creating client:', error);
    return { client: null, error: error as Error };
  }
};

// Function to get all clients
export const getClients = async (): Promise<{ clients: Client[] | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { clients: data as Client[], error: null };
  } catch (error) {
    console.error('Error getting clients:', error);
    return { clients: null, error: error as Error };
  }
};

// Function to get a client by ID
export const getClientById = async (id: string): Promise<{ client: Client | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return { client: data as Client, error: null };
  } catch (error) {
    console.error('Error getting client by ID:', error);
    return { client: null, error: error as Error };
  }
};

// Function to update a client
export const updateClient = async (id: string, clientData: Partial<Client>): Promise<{ client: Client | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return { client: data as Client, error: null };
  } catch (error) {
    console.error('Error updating client:', error);
    return { client: null, error: error as Error };
  }
};

// Function to create an AI agent for a client
export const createClientAgent = async (clientId: string, agentName: string, clientName: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Prepare the agent data according to the ai_agents table structure
    const agentData = {
      client_id: clientId,
      name: agentName, // Use name instead of agent_name to match table columns
      settings: {}, // Empty settings object
    };

    const { data, error } = await supabase
      .from('ai_agents')
      .insert([agentData]);

    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating client agent:', error);
    return { success: false, error: error as Error };
  }
};

// Function to delete a client
export const deleteClient = async (id: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: error as Error };
  }
};

// Function to send client invitation
export const sendClientInvitation = async (clientId: string, clientEmail: string): Promise<{ success: boolean; error: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-client-invitation', {
      body: { 
        client_id: clientId,
        email: clientEmail
      },
      // Fix the timeout by removing the incorrect options property
      timeout: 15000 // Use proper timeout parameter
    });

    if (error) {
      console.error('Error sending client invitation:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in client invitation process:', error);
    return { success: false, error };
  }
};

// Get client by user ID (for client dashboard)
export const getClientByUserId = async (userId: string): Promise<{ client: Client | null; error: Error | null }> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('client_id')
      .eq('user_id', userId)
      .eq('role', 'client')
      .single();

    if (userError) throw userError;
    
    if (!userData?.client_id) {
      return { client: null, error: new Error('No client associated with this user') };
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userData.client_id)
      .single();

    if (clientError) throw clientError;
    
    return { client: clientData as Client, error: null };
  } catch (error) {
    console.error('Error getting client by user ID:', error);
    return { client: null, error: error as Error };
  }
};
