
import { useMutation } from '@tanstack/react-query';
import { createClient, updateClient } from '@/services/clientService';
import { toast } from 'sonner';

export const useClientMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      client_name?: string;
      email?: string;
      company?: string;
      description?: string;
      client_id?: string;
      _tempLogoFile?: any;
      widget_settings?: {
        agent_name?: string;
        agent_description?: string;
        logo_url?: string;
        logo_storage_path?: string;
      };
    }) => {
      const { client_id, ...clientData } = data;
      
      if (client_id) {
        // Update existing client
        await updateClient(client_id, clientData);
        return client_id;
      } else {
        // Create new client
        const result = await createClient({
          client_name: clientData.client_name || '',
          email: clientData.email || '',
          company: clientData.company || '',
          description: clientData.description || '',
          agent_name: clientData.widget_settings?.agent_name
        });
        return { agentId: result.id };
      }
    },
    onSuccess: (data) => {
      if (typeof data === 'string') {
        toast.success('Client updated successfully');
      } else {
        toast.success('Client created successfully');
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    }
  });
};
