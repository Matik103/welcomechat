
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
    console.log(`Attempting to update client with ID: ${clientId}`, data);
    
    // Check if the client exists in the ai_agents table
    const { data: aiAgent, error: aiAgentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (aiAgentError) {
      console.log(`Client not found in ai_agents by id, trying client_id field`);
      const { data: aiAgent2, error: aiAgentError2 } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .single();
        
      if (aiAgentError2) {
        throw new Error(`Failed to fetch client: ${aiAgentError2.message}`);
      }
      
      // Use the agent found by client_id
      const updateData = {
        name: data.agent_name,
        agent_description: data.agent_description,
        client_name: data.client_name,
        email: data.email,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating ai_agent with client_id match:', updateData);
      
      // Update the ai_agents record
      const { data: updatedAgent, error: updateError } = await supabase
        .from('ai_agents')
        .update(updateData)
        .eq('id', aiAgent2.id)
        .select()
        .single();
        
      if (updateError) {
        throw new Error(`Failed to update ai_agent: ${updateError.message}`);
      }
      
      console.log('Successfully updated client with client_id match:', updatedAgent.id);
      return updatedAgent;
    }
    
    // Use the agent found directly by id
    const settingsObj = typeof aiAgent.settings === 'object' ? aiAgent.settings : {};
    
    const updateData = {
      name: data.agent_name,
      agent_description: data.agent_description,
      client_name: data.client_name,
      email: data.email,
      logo_url: data.logo_url,
      logo_storage_path: data.logo_storage_path,
      updated_at: new Date().toISOString(),
      // Also update the settings with the new data
      settings: {
        ...settingsObj,
        agent_name: data.agent_name,
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path
      }
    };
    
    console.log('Updating ai_agent with direct id match:', updateData);
    
    // Update the ai_agents record
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', aiAgent.id)
      .select()
      .single();
      
    if (updateError) {
      throw new Error(`Failed to update ai_agent: ${updateError.message}`);
    }
    
    console.log('Successfully updated client with direct id match:', updatedAgent.id);
    return updatedAgent;
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};
