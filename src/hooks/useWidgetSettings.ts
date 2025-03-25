
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/services/clientActivityService';
import { toast } from 'sonner';
import { WidgetSettings } from '@/types/widget-settings';

// Utility functions for generating embed codes
const generateBubbleEmbedCode = (clientId: string, settings: Partial<WidgetSettings> = {}): string => {
  return `<script src="https://ai-chat-widget.vercel.app/widget.js" 
  data-client-id="${clientId}" 
  data-mode="bubble" 
  ${settings.position ? `data-position="${settings.position}"` : ''}
  ${settings.chat_color ? `data-color="${settings.chat_color}"` : ''}></script>`;
};

const generateInlineEmbedCode = (clientId: string, settings: Partial<WidgetSettings> = {}): string => {
  return `<script src="https://ai-chat-widget.vercel.app/widget.js" 
  data-client-id="${clientId}" 
  data-mode="inline" 
  ${settings.chat_color ? `data-color="${settings.chat_color}"` : ''}></script>
  <div id="ai-chat-container"></div>`;
};

export const useWidgetSettings = (clientId: string) => {
  const queryClient = useQueryClient();
  const [embedCopied, setEmbedCopied] = useState(false);
  
  // Get initial settings
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['widget-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('settings, logo_url, name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .single();
      
      if (error) throw error;
      
      // Ensure settings object exists
      const widgetSettings = data?.settings || {};
      const typedSettings = widgetSettings as Record<string, any>;
      
      // Add logo URL if it exists
      if (data?.logo_url) {
        typedSettings.logo_url = data.logo_url;
      }
      
      // Add agent name if it exists
      if (data?.name) {
        typedSettings.agent_name = data.name;
      }
      
      return typedSettings as WidgetSettings;
    },
    staleTime: 60000, // 1 minute
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      const payload = {
        settings: { ...newSettings }
      };

      // Remove logo URL from settings if present (it's stored separately)
      if (payload.settings.logo_url) {
        delete payload.settings.logo_url;
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update(payload)
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (error) throw error;
      
      // Log this activity
      try {
        await logActivity('widget_settings_updated', 'Widget settings were updated');
      } catch (logErr) {
        console.error('Error logging activity:', logErr);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Widget settings saved successfully');
      queryClient.invalidateQueries({queryKey: ['widget-settings', clientId]});
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate embed codes
  const getBubbleEmbedCode = (customSettings?: WidgetSettings) => {
    return generateBubbleEmbedCode(clientId, customSettings || settings || {});
  };
  
  const getInlineEmbedCode = (customSettings?: WidgetSettings) => {
    return generateInlineEmbedCode(clientId, customSettings || settings || {});
  };

  // Copy embed code to clipboard
  const copyEmbedCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setEmbedCopied(true);
      
      // Log this activity
      try {
        await logActivity('embed_code_copied', 'Widget embed code was copied');
      } catch (logErr) {
        console.error('Error logging activity:', logErr);
      }
      
      toast.success('Embed code copied to clipboard');
      
      setTimeout(() => {
        setEmbedCopied(false);
      }, 3000);
      
      return true;
    } catch (err) {
      console.error('Failed to copy embed code:', err);
      toast.error('Failed to copy embed code. Please try again.');
      return false;
    }
  };

  // Upload logo
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      // First, upload the file to storage
      const fileName = `client-logos/${clientId}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('client-assets')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      // Update the ai_agents record with the new logo URL
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ logo_url: publicUrl, logo_storage_path: fileName })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (error) throw error;
      
      // Log this activity
      try {
        await logActivity('logo_uploaded', 'Client logo was uploaded');
      } catch (logErr) {
        console.error('Error logging activity:', logErr);
      }
      
      return publicUrl;
    },
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
      queryClient.invalidateQueries({queryKey: ['widget-settings', clientId]});
    },
    onError: (error) => {
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    settings: settings || {} as WidgetSettings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    getBubbleEmbedCode,
    getInlineEmbedCode,
    copyEmbedCode,
    embedCopied,
    uploadLogo: uploadLogo.mutate,
    isUploading: uploadLogo.isPending,
    // For compatibility with WidgetSettings component
    updateSettingsMutation: updateMutation,
    handleLogoUpload: (file: File) => uploadLogo.mutate(file)
  };
};
