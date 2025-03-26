
import { useState } from 'react';
import { ClientFormData } from '@/types/client-form';
import { updateClient } from '@/services/clientService';
import { uploadLogo } from '@/services/uploadService';
import { updateWidgetSettings } from '@/services/widgetSettingsService';
import { createClientActivity } from '@/services/clientActivityService';
import { toast } from 'sonner';

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
            
            // Log logo upload activity
            await createClientActivity('logo_uploaded', `Logo uploaded for client: ${data.client_name}`, {
              logo_url: uploadResult.url,
              client_id: clientId
            });
          }
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          toast.error('Failed to upload logo. Please try again.');
          // Continue with the rest of the update even if logo upload fails
        }
      }

      // Update the client record
      const clientResult = await updateClient({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email
      });

      // If widget settings are provided, update them
      if (data.widget_settings) {
        await updateWidgetSettings(clientId, data.widget_settings);
        
        // Log widget settings update activity
        await createClientActivity('widget_settings_updated', 'Widget settings updated', {
          client_id: clientId,
          settings_updated: Object.keys(data.widget_settings)
        });
      }

      // Log client update activity
      await createClientActivity('client_updated', `Client updated: ${data.client_name}`, {
        client_id: clientId,
        email: data.email
      });

      toast.success('Client information updated successfully!');
      return clientResult;
    } catch (err) {
      console.error('Error submitting client form:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
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
