
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { createClientActivity } from '@/services/clientActivityService';
import { useState } from 'react';

export function useClientList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch all clients from ai_agents table with interaction_type = 'config'
  const getClients = async (args?: { 
    status?: string;
    searchQuery?: string;
    includeDeleted?: boolean;
  }): Promise<Client[]> => {
    try {
      const { status, searchQuery, includeDeleted = false } = args || {};
      
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
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
      return (data || []).map(client => ({
        id: String(client.id || ''),
        client_id: String(client.client_id || ''),
        client_name: String(client.client_name || ''),
        email: String(client.email || ''),
        company: String(client.company || ''),
        description: String(client.description || ''),
        status: String(client.status || 'active'),
        created_at: String(client.created_at || new Date().toISOString()),
        updated_at: String(client.updated_at || new Date().toISOString()),
        deleted_at: client.deleted_at || null,
        deletion_scheduled_at: client.deletion_scheduled_at || null,
        last_active: client.last_active || null,
        logo_url: String(client.logo_url || ''),
        logo_storage_path: String(client.logo_storage_path || ''),
        agent_name: String(client.name || 'AI Assistant'),
        agent_description: String(client.agent_description || ''),
        widget_settings: typeof client.settings === 'object' ? client.settings : {},
        name: String(client.client_name || ''),
        is_error: false,
        user_id: ''
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
        .from('ai_agents')
        .update({ 
          deleted_at: null, 
          deletion_scheduled_at: null,
          status: 'active' 
        })
        .eq('client_id', clientId)
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
      
      // Return the first client in the result set
      const client = data[0];
      return {
        id: String(client.id || ''),
        client_id: String(client.client_id || ''),
        client_name: String(client.client_name || ''),
        email: String(client.email || ''),
        company: String(client.company || ''),
        description: String(client.description || ''),
        status: String(client.status || 'active'),
        created_at: String(client.created_at || ''),
        updated_at: String(client.updated_at || ''),
        deleted_at: client.deleted_at,
        deletion_scheduled_at: client.deletion_scheduled_at,
        last_active: client.last_active,
        logo_url: String(client.logo_url || ''),
        logo_storage_path: String(client.logo_storage_path || ''),
        agent_name: String(client.name || ''),
        agent_description: String(client.agent_description || ''),
        widget_settings: client.settings || {},
        name: String(client.client_name || ''),
        is_error: false,
        user_id: ''
      };
    } catch (error) {
      console.error('Failed to recover client:', error);
      throw error;
    }
  };
  
  // Use react-query for data fetching
  const { data: clients = [], isLoading, error, refetch } = useQuery({
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

  // Filter clients based on search query
  const filteredClients = searchQuery 
    ? clients.filter(client => 
        client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    clients,
    filteredClients,
    isLoading,
    error,
    refetch,
    recover: recoverMutation.mutate,
    isRecovering: recoverMutation.isPending,
    recoverError: recoverMutation.error,
    getFilteredClients: getClients,
    searchQuery,
    handleSearch
  };
}
