
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getWidgetSettings, updateWidgetSettings } from '@/utils/widgetSettingsUtils';
import { useClientActivity } from './useClientActivity';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';

export const useWidgetSettings = (clientId?: string, isClientView = false) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const { logClientActivity } = useClientActivity(clientId);

  // Get widget settings for the client
  const { 
    data: settings, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['widgetSettings', clientId],
    queryFn: async () => {
      if (!clientId) return defaultSettings;
      try {
        const result = await getWidgetSettings(clientId);
        
        // Ensure we have a valid object with all expected properties
        if (!result) return defaultSettings;
        
        // If settings from the DB are a string, parse them
        let parsedSettings = {}; 
        if (typeof result === 'string') {
          try {
            parsedSettings = JSON.parse(result);
          } catch (e) {
            console.error('Failed to parse widget settings:', e);
            parsedSettings = {};
          }
        } else if (typeof result === 'object') {
          parsedSettings = result;
        }
        
        // Merge with defaults to ensure all properties exist
        return {
          ...defaultSettings,
          ...parsedSettings
        };
      } catch (error) {
        console.error('Error fetching widget settings:', error);
        return defaultSettings;
      }
    },
    enabled: !!clientId,
  });

  // Mutation to update widget settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      if (!clientId) throw new Error('Client ID is required');
      
      // Merge with existing settings
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      
      // Update widget settings in database
      const result = await updateWidgetSettings(clientId, updatedSettings);
      
      // Log the activity
      await logClientActivity(
        'widget_settings_updated',
        'Widget settings updated',
        { settings: updatedSettings }
      );
      
      return result;
    },
    onSuccess: () => {
      toast.success('Widget settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['widgetSettings', clientId] });
      
      // Also invalidate client data since widget settings are part of it
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    },
    onError: (error) => {
      console.error('Error updating widget settings:', error);
      toast.error('Failed to update widget settings');
    }
  });

  // Function to handle logo upload
  const handleLogoUpload = async (file: File) => {
    if (!clientId) {
      toast.error('Client ID is required to upload a logo');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a storage path
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}-logo-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `clients/${clientId}/logos/${fileName}`;
      
      // Upload the file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('client-assets')
        .getPublicUrl(storagePath);
      
      const publicUrl = publicUrlData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded logo');
      }
      
      // Update widget settings with new logo URL
      await updateSettingsMutation.mutateAsync({
        ...defaultSettings,
        logo_url: publicUrl,
        logo_storage_path: storagePath
      });
      
      // Log the activity
      await logClientActivity(
        'logo_uploaded',
        'Logo uploaded',
        { 
          logo_url: publicUrl,
          logo_storage_path: storagePath
        }
      );
      
      toast.success('Logo uploaded successfully');
      return { publicUrl, storagePath };
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
    updateSettingsMutation,
    handleLogoUpload,
    isUploading,
    refetch
  };
};
