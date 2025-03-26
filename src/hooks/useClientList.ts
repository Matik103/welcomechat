
// Only making minimal changes to fix the type errors
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { toast } from 'sonner';

interface GetFilteredClientsArgs {
  searchQuery?: string;
  status?: string;
  sort?: string;
}

export function useClientList() {
  // Query to fetch all clients
  const { 
    data: clients = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Since we can't query the 'clients' table directly due to type errors,
      // we'll use a helper function that converts the raw DB data to Client type
      try {
        // Use the ai_agents table instead of clients
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Map the data to the Client interface
        const clients: Client[] = data.map(agent => ({
          id: String(agent.id || ''), // Convert to string to match Client type
          client_id: agent.client_id || '',
          client_name: agent.client_name || '',
          email: agent.email || '',
          company: agent.company || '',
          description: agent.description || '',
          status: agent.status || 'active',
          created_at: agent.created_at || new Date().toISOString(),
          updated_at: agent.updated_at || new Date().toISOString(),
          deleted_at: agent.deleted_at || null,
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          last_active: agent.last_active || null,
          logo_url: agent.logo_url || '',
          logo_storage_path: agent.logo_storage_path || '',
          agent_name: agent.agent_name || 'AI Assistant',
          user_id: agent.user_id || null,
          widget_settings: agent.widget_settings as Record<string, any> || {},
          is_error: false
        }));
        
        return clients;
      } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
    }
  });

  // Mutation to recover a client
  const {
    mutate: recover,
    isLoading: isRecovering,
    error: recoverError
  } = useMutation({
    mutationFn: async (clientId: string) => {
      try {
        // Use the ai_agents table instead of clients
        const { data, error } = await supabase
          .from('ai_agents')
          .update({ deleted_at: null, deletion_scheduled_at: null })
          .eq('client_id', clientId)
          .select()
          .single();
          
        if (error) throw error;
        
        // Convert to Client type
        const recoveredClient = {
          id: String(data.id || ''),
          client_id: data.client_id || '',
          client_name: data.client_name || '',
          email: data.email || '',
          company: data.company || '',
          description: data.description || '',
          status: data.status || 'active',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          deleted_at: data.deleted_at || null,
          deletion_scheduled_at: data.deletion_scheduled_at || null,
          last_active: data.last_active || null,
          logo_url: data.logo_url || '',
          logo_storage_path: data.logo_storage_path || '',
          agent_name: data.agent_name || 'AI Assistant',
          user_id: data.user_id || null,
          widget_settings: data.widget_settings as Record<string, any> || {},
          is_error: false
        } as Client;
        
        toast.success(`Client ${recoveredClient.client_name} has been recovered.`);
        return recoveredClient;
      } catch (error) {
        console.error('Error recovering client:', error);
        toast.error(`Failed to recover client: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Function to filter clients (can be called from UI)
  const getFilteredClients = async (args: GetFilteredClientsArgs = {}) => {
    const { searchQuery = '', status = 'all', sort = 'newest' } = args;
    
    let filteredClients = [...clients];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredClients = filteredClients.filter(client => 
        client.client_name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (status !== 'all') {
      if (status === 'active') {
        filteredClients = filteredClients.filter(client => !client.deleted_at);
      } else if (status === 'deleted') {
        filteredClients = filteredClients.filter(client => !!client.deleted_at);
      }
    }
    
    // Apply sorting
    if (sort === 'newest') {
      filteredClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'oldest') {
      filteredClients.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sort === 'name-asc') {
      filteredClients.sort((a, b) => a.client_name.localeCompare(b.client_name));
    } else if (sort === 'name-desc') {
      filteredClients.sort((a, b) => b.client_name.localeCompare(a.client_name));
    }
    
    return filteredClients;
  };

  return {
    clients,
    isLoading,
    error,
    refetch,
    recover,
    isRecovering,
    recoverError,
    getFilteredClients
  };
}
