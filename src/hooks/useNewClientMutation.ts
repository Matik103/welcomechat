
import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/services/clientService';
import { toast } from 'sonner';

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      client_name?: string;
      email?: string;
      company?: string;
      description?: string;
      widget_settings?: {
        agent_name?: string;
        agent_description?: string;
        logo_url?: string;
        logo_storage_path?: string;
      };
    }) => {
      // Create new client with partial data
      const result = await createClient({
        client_name: data.client_name || '',
        email: data.email || '',
        company: data.company || '',
        description: data.description || '',
        agent_name: data.widget_settings?.agent_name
      });
      
      return {
        client: result,
        authResult: null,
        emailSent: true,
        emailError: null
      };
    },
    onSuccess: () => {
      toast.success('Client created successfully');
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    }
  });
};
