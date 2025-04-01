
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';
import { getWidgetSettings, updateWidgetSettings } from '@/services/widgetSettingsService';
import { supabase } from '@/integrations/supabase/client';

export function useWidgetSettings(clientId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch widget settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['widget-settings', clientId],
    queryFn: () => clientId ? getWidgetSettings(clientId) : Promise.resolve(defaultSettings),
    enabled: !!clientId
  });

  // Update widget settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<WidgetSettings>): Promise<void> => {
      if (!clientId) throw new Error('Client ID is required');
      
      console.log('Updating widget settings:', newSettings);
      
      // Merge with existing settings to ensure we have a complete object
      const updatedSettings = {
        ...(settings || defaultSettings),
        ...newSettings
      };
      
      await updateWidgetSettings(clientId, updatedSettings);
    },
    onSuccess: () => {
      refetch();
      
      // Also invalidate client query to ensure bidirectional sync
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      
      toast.success('Widget settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating widget settings:', error);
      toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update logo
  const updateLogo = async (url: string, path: string): Promise<void> => {
    try {
      if (!clientId) throw new Error('Client ID is required');
      
      console.log('Updating logo:', { url, path });
      
      // Update in ai_agents table
      const { error: agentError } = await supabase
        .from('ai_agents')
        .update({
          logo_url: url,
          logo_storage_path: path,
          updated_at: new Date().toISOString(),
          settings: {
            ...(settings || defaultSettings),
            logo_url: url,
            logo_storage_path: path
          }
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (agentError) {
        console.error('Error updating logo in ai_agents:', agentError);
        throw agentError;
      }
      
      // Update widget settings cache
      queryClient.setQueryData(['widget-settings', clientId], {
        ...(settings || defaultSettings),
        logo_url: url,
        logo_storage_path: path
      });
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['widget-settings', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      
      toast.success('Logo updated successfully');
    } catch (error) {
      console.error('Error in updateLogo:', error);
      toast.error(`Failed to update logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
    refetch,
    updateSettings: updateSettingsMutation.mutate,
    isPending: updateSettingsMutation.isPending,
    updateLogo,
    isUploading
  };
}
