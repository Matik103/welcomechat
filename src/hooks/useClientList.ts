
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';

export const useClientList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Main query to fetch clients
  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  // Filter clients based on search query
  const filteredClients = clients?.filter(client => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      client.client_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.company?.toLowerCase().includes(query)
    );
  }) || [];

  // Function to fetch clients
  async function fetchClients() {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    // Transform the data to match the Client interface
    const transformedClients: Client[] = data.map(item => {
      const settings = item.settings || {};
      
      return {
        id: item.id,
        client_id: item.client_id || item.id,
        client_name: item.client_name || item.name,
        email: item.email || '',
        company: item.company || '',
        description: item.description || '',
        status: item.status || 'active',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        deleted_at: item.deleted_at || null,
        deletion_scheduled_at: item.deletion_scheduled_at || null,
        last_active: item.last_active || null,
        logo_url: settings.logo_url || '',
        logo_storage_path: settings.logo_storage_path || '',
        agent_name: item.name || settings.agent_name || '',
        agent_description: item.agent_description || settings.agent_description || '',
        widget_settings: settings || {},
        name: item.client_name || item.name || '',
        is_error: item.is_error || false
      };
    });

    return transformedClients;
  }

  // Mutation to delete a client
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          deleted_at: now,
          updated_at: now,
          status: 'inactive'
        })
        .eq('id', clientId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  // Mutation to recover a deleted client
  const recoverMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          deleted_at: null,
          deletion_scheduled_at: null,
          updated_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', clientId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  // Function to get filtered clients (e.g., for admin purposes)
  const getFilteredClients = async ({ includeDeleted = false, limit = 100 } = {}) => {
    let query = supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered clients:', error);
      throw error;
    }

    return data.map((client) => ({
      id: client.id,
      client_id: client.client_id || client.id,
      client_name: client.client_name || client.name,
      email: client.email,
      company: client.company,
      status: client.status,
      created_at: client.created_at,
      deleted_at: client.deleted_at
    }));
  };

  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    clients,
    filteredClients,
    isLoading,
    error,
    refetch,
    searchQuery,
    handleSearch,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    recover: recoverMutation.mutate,
    isRecovering: recoverMutation.isPending,
    recoverError: recoverMutation.error,
    getFilteredClients
  };
};
