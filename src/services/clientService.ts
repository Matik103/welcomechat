// Fix references to user_id in clientService.ts
// We need to replace any references to client.user_id with alternative properties

import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';

// Function to create a new client
export const createClient = async (client: Client): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
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

// Fix the function where user_id is used
export const getClient = async (clientId: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', clientId)
      .single();
    
    if (error) throw error;
    
    // Return the client data with proper ID mappings
    const client = data as Client;
    // Instead of accessing user_id directly, use client_id
    return client;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

// Similarly fix any other functions that reference user_id
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
      .eq('client_id', clientId)
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
      .eq('client_id', clientId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};
