
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';
import { WidgetSettings } from '@/types/client-form';
import { toast } from 'sonner';

export const useWidgetSettings = (clientId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Update agent name
  const updateAgentName = useCallback(async (agentName: string) => {
    if (!clientId) {
      console.error('Client ID is required');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Update the agent_name in the ai_agents table
      const { error: agentUpdateError } = await supabase
        .from('ai_agents')
        .update({ name: agentName })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');

      if (agentUpdateError) {
        throw new Error(`Failed to update agent name: ${agentUpdateError.message}`);
      }

      // Log the activity
      await createClientActivity(
        clientId,
        "agent_name_updated",
        `Updated agent name to "${agentName}"`,
        { agent_name: agentName }
      );

      toast.success('Agent name updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating agent name:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(`Failed to update agent name: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [clientId]);

  // Update agent description
  const updateAgentDescription = useCallback(async (description: string) => {
    if (!clientId) {
      console.error('Client ID is required');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Get the current settings from the ai_agents table
      const { data: agentData, error: getError } = await supabase
        .from('ai_agents')
        .select('settings')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .single();

      if (getError) {
        throw new Error(`Failed to get agent data: ${getError.message}`);
      }

      // Update the settings with the new description
      const settings = agentData?.settings || {};
      settings.agent_description = description;

      // Update the ai_agents table with the new settings
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          settings,
          agent_description: description 
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');

      if (updateError) {
        throw new Error(`Failed to update agent description: ${updateError.message}`);
      }

      // Log the activity
      await createClientActivity(
        clientId,
        "agent_description_updated",
        `Updated agent description`,
        { description_length: description.length }
      );

      toast.success('Agent description updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating agent description:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(`Failed to update agent description: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [clientId]);

  // Update logo
  const updateLogo = useCallback(async (logoUrl: string, storageFilePath?: string) => {
    if (!clientId) {
      console.error('Client ID is required');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Get current settings from ai_agents
      const { data: agentData, error: getError } = await supabase
        .from('ai_agents')
        .select('settings')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .single();

      if (getError) {
        throw new Error(`Failed to get agent data: ${getError.message}`);
      }

      // Update settings with new logo info
      const settings = agentData?.settings || {};
      settings.logo_url = logoUrl;
      
      if (storageFilePath) {
        settings.logo_storage_path = storageFilePath;
      }

      // Update ai_agents with new settings and logo info
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          settings,
          logo_url: logoUrl,
          logo_storage_path: storageFilePath
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');

      if (updateError) {
        throw new Error(`Failed to update logo: ${updateError.message}`);
      }

      // Log the activity
      await createClientActivity(
        clientId,
        "agent_logo_updated",
        `Updated agent logo`,
        { 
          logo_url: logoUrl,
          has_storage_path: !!storageFilePath 
        }
      );

      toast.success('Logo updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating logo:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error(`Failed to update logo: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [clientId]);

  return {
    updateAgentName,
    updateAgentDescription,
    updateLogo,
    isUpdating,
    error
  };
};
