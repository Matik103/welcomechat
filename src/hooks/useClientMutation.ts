
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { extractWidgetSettings, updateWidgetSettings } from '@/utils/widgetSettingsUtils';
import { Client } from '@/types/client';

export const useClientMutation = () => {
  const [isPending, setIsPending] = useState(false);

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
      
      // Update clients table
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          client_name: client.client_name,
          email: client.email,
          agent_name: agentName,
          updated_at: new Date().toISOString(),
          // If widget_settings exists in the update, use it, otherwise create a minimal one with synced fields
          widget_settings: client.widget_settings || {
            agent_name: agentName,
            agent_description: agentDescription,
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath
          }
        })
        .eq('id', client.client_id);

      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }
      
      // Create or update the corresponding AI agent record
      const { data: existingAgent, error: checkError } = await supabase
        .from('ai_agents')
        .select('id, settings')
        .eq('client_id', client.client_id)
        .eq('interaction_type', 'config')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for AI agent:', checkError);
      }
      
      // Get the current widget settings
      const currentSettings = existingAgent?.settings || {};
      
      // Prepare the settings object with synced fields
      const updatedSettings = {
        ...(typeof currentSettings === 'object' ? currentSettings : {}),
        agent_name: agentName,
        agent_description: agentDescription,
        logo_url: logoUrl,
        logo_storage_path: logoStoragePath
      };
      
      if (existingAgent) {
        // Update existing AI agent
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({
            name: agentName,
            agent_description: agentDescription,
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
      
      console.log('Client and AI agent updated successfully');
      
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
