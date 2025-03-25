
import { useState } from 'react';
import { createClient, updateClient } from '@/services/clientService';
import { ClientFormData } from '@/types/client-form';

export const useClientFormSubmission = (
  isEdit: boolean = false,
  onSuccess?: (clientId: string) => void,
  existingClientId?: string
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (formData: any): Promise<string | void> => {
    if (!formData) {
      setError('No form data provided');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Make sure required fields are present
      const clientFormData: ClientFormData = {
        client_name: formData.client_name || '',
        email: formData.email || '',
        widget_settings: {
          agent_name: formData.agent_name || '',
          agent_description: formData.agent_description || '',
          logo_url: formData.logo_url || '',
          logo_storage_path: formData.logo_storage_path || '',
        }
      };

      if (isEdit && existingClientId) {
        // Update existing client
        await updateClient(existingClientId, clientFormData);
        if (onSuccess) onSuccess(existingClientId);
        return existingClientId;
      } else {
        // Create new client
        const newClientId = await createClient(clientFormData);
        if (onSuccess && newClientId) onSuccess(newClientId);
        return newClientId;
      }
    } catch (err) {
      console.error('Error submitting client form:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return;
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
