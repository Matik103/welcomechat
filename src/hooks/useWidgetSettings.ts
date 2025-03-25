
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
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // First update the agent_name in the clients table
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ agent_name: agentName })
        .eq('id', clientId);

      if (clientUpdateError) {
        throw new Error(`Failed to update agent name: ${clientUpdateError.message}`);
      }

      // Then update the name in the ai_agents table
      const { error: agentUpdateError } = await supabase
        .from('ai_agents')
        .update({ name: agentName })
        .eq('client_id', clientId);

      if (agentUpdateError) {
        console.warn(`Warning: Could not update AI agent name: ${agentUpdateError.message}`);
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
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Update the widget_settings in the clients table
      const { data: clientData, error: clientGetError } = await supabase
        .from('clients')
        .select('widget_settings')
        .eq('id', clientId)
        .single();

      if (clientGetError) {
        throw new Error(`Failed to get client: ${clientGetError.message}`);
      }

      const widgetSettings = clientData?.widget_settings || {};
      widgetSettings.agent_description = description;

      const { error: updateError } = await supabase
        .from('clients')
        .update({ widget_settings })
        .eq('id', clientId);

      if (updateError) {
        throw new Error(`Failed to update agent description: ${updateError.message}`);
      }

      // Also update in the ai_agents table
      const { error: agentUpdateError } = await supabase
        .from('ai_agents')
        .update({ agent_description: description })
        .eq('client_id', clientId);

      if (agentUpdateError) {
        console.warn(`Warning: Could not update AI agent description: ${agentUpdateError.message}`);
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
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Update the widget_settings in the clients table
      const { data: clientData, error: clientGetError } = await supabase
        .from('clients')
        .select('widget_settings')
        .eq('id', clientId)
        .single();

      if (clientGetError) {
        throw new Error(`Failed to get client: ${clientGetError.message}`);
      }

      const widgetSettings = clientData?.widget_settings || {};
      widgetSettings.logo_url = logoUrl;
      
      if (storageFilePath) {
        widgetSettings.logo_storage_path = storageFilePath;
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update({ widget_settings })
        .eq('id', clientId);

      if (updateError) {
        throw new Error(`Failed to update logo: ${updateError.message}`);
      }

      // Also update in the ai_agents table
      const { error: agentUpdateError } = await supabase
        .from('ai_agents')
        .update({ 
          logo_url: logoUrl, 
          logo_storage_path: storageFilePath 
        })
        .eq('client_id', clientId);

      if (agentUpdateError) {
        console.warn(`Warning: Could not update AI agent logo: ${agentUpdateError.message}`);
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
