import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";
import { Client } from "@/types/client";
import { JsonObject } from "@/types/supabase-extensions";
import { ClientFormData } from '@/types/client-form';

/**
 * Get the count of active clients
 * @returns Object containing total clients count and active clients count
 */
export const getActiveClientsCount = async (): Promise<{ total: number, active: number }> => {
  try {
    // Get all non-deleted clients
    const { count: totalCount, error: countError } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null);
      
    if (countError) throw countError;
    
    // Get active clients (those with recent activity in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    
    const { data: activeClientsData, error: activeError } = await supabase
      .from('ai_agents')
      .select('client_id, last_active')
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null)
      .gt('last_active', timeAgo.toISOString());
      
    if (activeError) throw activeError;
    
    // Count unique client IDs with recent activity
    const uniqueClientIds = new Set();
    activeClientsData?.forEach(item => {
      if (item.client_id) uniqueClientIds.add(item.client_id);
    });
    
    return {
      total: totalCount || 0,
      active: uniqueClientIds.size
    };
  } catch (error) {
    console.error("Error getting active clients count:", error);
    return { total: 0, active: 0 };
  }
};

/**
 * Update a client with new data
 * @param clientId The ID of the client to update
 * @param data The data to update the client with
 * @returns The updated client
 */
export const updateClient = async (clientId: string, data: Partial<ClientFormData>) => {
  try {
    // First, check if the client exists
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch client: ${fetchError.message}`);
    }

    if (!existingClient) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    // Update the client record
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update client: ${updateError.message}`);
    }

    // Update the corresponding ai_agents record if it exists
    const { error: agentUpdateError } = await supabase
      .from('ai_agents')
      .update({
        name: data.agent_name,
        description: data.agent_description,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    if (agentUpdateError) {
      console.error('Failed to update AI agent:', agentUpdateError);
      // Don't throw here as the client update was successful
    }

    return updatedClient;
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};
