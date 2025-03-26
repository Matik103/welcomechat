
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { createClientActivity } from '@/services/clientActivityService';

export function useClientList() {
  const queryClient = useQueryClient();
  
  // Fetch all clients with the specified filters
  const getClients = async (args?: { 
    status?: string;
    searchQuery?: string;
    includeDeleted?: boolean;
  }): Promise<Client[]> => {
    try {
      const { status, searchQuery, includeDeleted = false } = args || {};
      
      let query = supabase
        .from('clients')
        .select('*');
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Apply deleted filter
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      // Transform data to match Client type
      return data.map(client => ({
        id: client.id,
        client_id: client.id, // Set client_id to id for compatibility
        client_name: client.client_name || '',
        email: client.email || '',
        company: client.company || '',
        description: '', // Default value
        status: client.status || 'active',
        created_at: client.created_at || new Date().toISOString(),
        updated_at: client.updated_at || new Date().toISOString(),
        deleted_at: client.deleted_at,
        deletion_scheduled_at: client.deletion_scheduled_at,
        last_active: client.last_active,
        logo_url: client.logo_url || '',
        logo_storage_path: client.logo_storage_path || '',
        agent_name: client.agent_name || 'AI Assistant',
        agent_description: '',
        widget_settings: client.widget_settings || {},
        name: client.client_name || '', // For backward compatibility
        is_error: false
      }));
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  };
  
  // Mutation to recover a deleted client
  const recoverClient = async (clientId: string): Promise<Client> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ 
          deleted_at: null, 
          deletion_scheduled_at: null,
          status: 'active' 
        })
        .eq('id', clientId)
        .select();
      
      if (error) {
        console.error('Error recovering client:', error);
        throw error;
      }
      
      // Log the recovery activity
      await createClientActivity(
        clientId,
        'client_recovered',
        `Client was recovered from deletion`
      );
      
      return data[0] as Client;
    } catch (error) {
      console.error('Failed to recover client:', error);
      throw error;
    }
  };
  
  // Use react-query for data fetching
  const query = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
  });
  
  // Use react-query for the recovery mutation
  const recoverMutation = useMutation({
    mutationFn: recoverClient,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    recover: recoverMutation.mutate,
    isRecovering: recoverMutation.isPending,
    recoverError: recoverMutation.error,
    getFilteredClients: getClients
  };
}
