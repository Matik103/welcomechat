
import { useState } from 'react';
import { ClientFormData } from '@/types/client-form';
import { updateClient } from '@/services/clientService';
import { uploadLogo } from '@/services/uploadService';
import { updateWidgetSettings } from '@/services/widgetSettingsService';
import { toast } from 'sonner';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';
import { defaultSettings } from '@/types/widget-settings';
import { WidgetSettings } from '@/types/widget-settings';

export const useClientFormSubmission = (clientId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (formData: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure client_id is always set
      const data = {
        ...formData,
        client_id: clientId
      };

      // First, upload the logo if there is one
      if (formData._tempLogoFile) {
        try {
          const uploadResult = await uploadLogo(formData._tempLogoFile, clientId);
          
          if (uploadResult.url) {
            // Update widget settings with the new logo URL
            if (!data.widget_settings) {
              data.widget_settings = {};
            }
            data.widget_settings.logo_url = uploadResult.url;
            data.widget_settings.logo_storage_path = uploadResult.path;
            
            // Log logo upload activity using console instead of database
            console.log(`[ACTIVITY LOG]: Logo uploaded for client: ${data.client_name}`, {
              clientId,
              activityType: 'client_updated', // Using string literal instead of enum
              logoUrl: uploadResult.url,
              timestamp: new Date().toISOString()
            });
          }
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          toast.error('Failed to upload logo. Please try again.');
          // Continue with the rest of the update even if logo upload fails
        }
      }

      // Update the client record
      const clientResult = await updateClient(clientId, {
        client_name: data.client_name,
        email: data.email
      });

      // If widget settings are provided, update them with defaults for missing values
      if (data.widget_settings) {
        // Create a complete WidgetSettings object by merging with default settings
        const completeSettings: WidgetSettings = {
          ...defaultSettings,
          agent_name: data.widget_settings.agent_name || data.client_name,
          agent_description: data.widget_settings.agent_description || "Your helpful AI assistant",
          logo_url: data.widget_settings.logo_url || defaultSettings.logo_url,
          logo_storage_path: data.widget_settings.logo_storage_path || defaultSettings.logo_storage_path
        };
        
        await updateWidgetSettings(clientId, completeSettings);
        
        // Log widget settings update with console instead of activity_type enum
        console.log(`[ACTIVITY LOG]: Widget settings updated for client: ${data.client_name}`, {
          clientId,
          activityType: 'client_updated', // Using string literal instead of enum
          settingsUpdated: Object.keys(data.widget_settings),
          timestamp: new Date().toISOString()
        });
      }

      // Log client update with console instead of activity_type enum
      console.log(`[ACTIVITY LOG]: Client updated: ${data.client_name}`, {
        clientId,
        activityType: 'client_updated', // Using string literal instead of enum
        email: data.email,
        timestamp: new Date().toISOString()
      });

      toast.success('Client information updated successfully!');
      return clientResult;
    } catch (err) {
      console.error('Error submitting client form:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to update client information');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error
  };
};
