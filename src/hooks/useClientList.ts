
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { toast } from 'sonner';

export function useClientList() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Query to fetch clients
  const { data: clients = [], isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Fetch from ai_agents table instead of clients
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      // Adapt the data to match the Client interface
      const adaptedClients: Client[] = (data || []).map(item => {
        // Handle widget_settings to ensure it's a proper object
        let widgetSettings: Record<string, any> = {};
        if (item.widget_settings) {
          try {
            if (typeof item.widget_settings === 'string') {
              widgetSettings = JSON.parse(item.widget_settings);
            } else if (typeof item.widget_settings === 'object') {
              widgetSettings = item.widget_settings as Record<string, any>;
            }
          } catch (e) {
            console.error('Error parsing widget_settings:', e);
          }
        }

        return {
          id: item.id || '',
          client_id: item.client_id || item.id || '',
          client_name: item.client_name || item.name || '',
          email: item.email || '',
          company: item.company || '',
          description: item.description || '',
          status: item.status || 'active',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          deleted_at: item.deleted_at || null,
          deletion_scheduled_at: item.deletion_scheduled_at || null,
          last_active: item.last_active || null,
          logo_url: item.logo_url || '',
          logo_storage_path: item.logo_storage_path || '',
          agent_name: item.name || '',
          agent_description: item.agent_description || '',
          widget_settings: widgetSettings,
          name: item.client_name || item.name || '',
          is_error: item.is_error || false
        };
      });

      return adaptedClients;
    }
  });

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    
    const searchTerms = searchQuery.toLowerCase().split(' ');
    
    return searchTerms.every(term => {
      return (
        (client.client_name?.toLowerCase().includes(term)) ||
        (client.agent_name?.toLowerCase().includes(term)) ||
        (client.email?.toLowerCase().includes(term)) ||
        (client.company?.toLowerCase().includes(term))
      );
    });
  });

  // Mutation to recover a deleted client
  const recoverMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          deleted_at: null,
          deletion_scheduled_at: null
        })
        .eq('id', clientId);
      
      if (error) throw error;
      return clientId;
    },
    onSuccess: () => {
      refetch();
      toast.success('Client recovered successfully');
    },
    onError: (error) => {
      console.error('Error recovering client:', error);
      toast.error('Failed to recover client');
    }
  });

  // Get filtered clients function
  const getFilteredClients = async ({ status }: { status?: string } = {}) => {
    try {
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting filtered clients:', error);
      throw error;
    }
  };

  return {
    clients,
    filteredClients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch,
    recover: recoverMutation.mutate,
    isRecovering: recoverMutation.isPending,
    recoverError: recoverMutation.error as Error,
    getFilteredClients
  };
}
