import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';
import { getWidgetSettings, updateWidgetSettings } from '@/services/widgetSettingsService';
import { supabase } from '@/integrations/supabase/client';

export const useWidgetSettings = (clientId: string | undefined) => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Add error handling and retry logic
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['widget-settings', clientId],
    queryFn: async () => {
      if (!clientId) return defaultSettings;
      try {
        const data = await getWidgetSettings(clientId);
        return {
          ...defaultSettings, // Ensure all required fields have defaults
          ...data,
          clientId,
          client_id: clientId,
        };
      } catch (err) {
        console.error('Error fetching widget settings:', err);
        throw err;
      }
    },
    enabled: !!clientId,
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      if (!clientId) throw new Error('Client ID is required');
      return updateWidgetSettings(clientId, newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings', clientId] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update logo with proper type handling
  const updateLogo = async (url: string, path: string): Promise<void> => {
    try {
      if (!clientId) throw new Error('Client ID is required');
      
      console.log('Updating logo:', { url, path });
      
      // Update in ai_agents table with proper JSON serialization
      const settingsForDb = {
        ...(settings || defaultSettings),
        logo_url: url,
        logo_storage_path: path
      };

      const { error: agentError } = await supabase
        .from('ai_agents')
        .update({
          logo_url: url,
          logo_storage_path: path,
          updated_at: new Date().toISOString(),
          settings: JSON.stringify(settingsForDb) // Properly serialize settings as JSON
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
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
    updateLogo,
    isUploading
  };
};
