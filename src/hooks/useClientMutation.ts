
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { useQueryClient } from '@tanstack/react-query';

export const useClientMutation = () => {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const mutateAsync = async (client: Partial<Client>): Promise<void> => {
    if (!client.client_id) {
      throw new Error('Client ID is required');
    }

    setIsPending(true);
    try {
      console.log('Updating client with ID:', client.client_id);
      
      // Extract agent-related fields that need to be synced
      const agentName = client.agent_name || client.name || '';
      const agentDescription = client.agent_description || '';
      const logoUrl = client.logo_url || '';
      const logoStoragePath = client.logo_storage_path || '';
      const clientName = client.client_name || '';
      const email = client.email || '';
      
      // Check if ai_agent record exists
      const { data: existingAgent, error: checkAgentError } = await supabase
        .from('ai_agents')
        .select('id, settings')
        .eq('client_id', client.client_id)
        .eq('interaction_type', 'config')
        .maybeSingle();
        
      if (checkAgentError) {
        console.error('Error checking for AI agent:', checkAgentError);
        throw checkAgentError;
      }
      
      // Get the current settings to preserve all values
      let currentSettings = {};
      
      if (existingAgent) {
        // Use settings from the fetched agent data
        currentSettings = typeof existingAgent.settings === 'object' 
          ? existingAgent.settings 
          : {};
      }
      
      // Prepare the settings object with synced fields
      const updatedSettings = {
        ...currentSettings,
        agent_name: agentName,
        agent_description: agentDescription,
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath,
        client_name: clientName,
        email: email
      };
      
      if (existingAgent) {
        // Update existing AI agent
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({ 
            name: agentName,
            agent_description: agentDescription,
            client_name: clientName,
            email: email,
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath,
            settings: updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAgent.id);
          
        if (updateError) {
          console.error('Error updating AI agent:', updateError);
          throw updateError;
        }
      } else {
        // Create new AI agent if it doesn't exist
        const { error: createError } = await supabase
          .from('ai_agents')
          .insert({
            client_id: client.client_id,
            name: agentName,
            agent_description: agentDescription,
            client_name: clientName,
            email: email,
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath,
            interaction_type: 'config',
            settings: updatedSettings,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (createError) {
          console.error('Error creating AI agent:', createError);
          throw createError;
        }
      }
      
      // Invalidate client list query to prevent duplications
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Invalidate the specific client query to ensure proper data refresh
      queryClient.invalidateQueries({ queryKey: ['client', client.client_id] });
      
      // Invalidate widget settings to ensure bidirectional sync
      queryClient.invalidateQueries({ queryKey: ['widget-settings', client.client_id] });
      
      console.log('AI agent updated successfully');
      
    } catch (error) {
      console.error('Error in client mutation:', error);
      toast.error(`Error updating client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    isPending
  };
};
