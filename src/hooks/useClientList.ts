
import { useState, useEffect, useCallback } from 'react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';

export const useClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Convert to Client type
      const formattedClients: Client[] = data.map(agent => ({
        id: agent.id,
        client_id: agent.client_id || '',
        client_name: agent.client_name || '',
        email: agent.email || '',
        status: agent.status as 'active' | 'inactive' | 'deleted' || 'active',
        created_at: agent.created_at || '',
        updated_at: agent.updated_at || '',
        agent_name: agent.name || '',
        agent_description: agent.agent_description || '',
        logo_url: agent.logo_url || '',
        widget_settings: agent.settings || {},
        user_id: '',
        company: agent.company || '',
        description: agent.description || '',
        logo_storage_path: agent.logo_storage_path || '',
        deletion_scheduled_at: agent.deletion_scheduled_at || null,
        deleted_at: agent.deleted_at || null,
        last_active: agent.last_active || null,
        name: agent.name || '',
        is_error: agent.is_error || false
      }));
      
      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);
  
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch: fetchClients
  };
};
