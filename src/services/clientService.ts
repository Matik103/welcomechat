
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';

// Function to create a new client
export const createClient = async (clientData: Partial<Client>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    return null;
  }
};

// Function to fetch all clients
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) throw error;
    
    return data as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

// Function to get a client by ID
export const getClient = async (clientId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) throw error;
    
    // Return the client data with proper ID mappings
    return data as Client;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

// Function to get a client by email
export const getClientByEmail = async (email: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    
    // Return the client data
    return data as Client;
  } catch (error) {
    console.error('Error fetching client by email:', error);
    return null;
  }
};

// Function to update an existing client
export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as Client;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

// Function to delete a client
export const deleteClient = async (clientId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

// Alias for getClient to maintain compatibility with AddEditClient.tsx
export const getClientById = getClient;
