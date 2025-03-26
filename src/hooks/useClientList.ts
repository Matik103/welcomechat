
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { getSettingsProp } from '@/utils/clientSettingsUtils';

export const useClientList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
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

      return (data || []).map(client => ({
        id: client.client_id || client.id,
        client_name: client.client_name || getSettingsProp(client.settings, 'client_name', ''),
        email: client.email || '',
        company: client.company || '',
        logo_url: client.logo_url || getSettingsProp(client.settings, 'logo_url', ''),
        created_at: client.created_at,
        last_active: client.last_active,
        widget_settings: client.widget_settings,
        agent_name: client.name
      }));
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredClients = data?.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.client_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return {
    clients: filteredClients,
    isLoading,
    error,
    refetch,
    searchQuery,
    handleSearch
  };
};
