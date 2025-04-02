
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';

export const useClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const lastFetchTime = useRef<number>(0);
  const initialLoadDone = useRef<boolean>(false);

  const fetchClients = useCallback(async (force = false) => {
    // Don't refetch if we just did within the last 15 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 15000) {
      console.log('Skipping fetch - too soon after last fetch');
      return;
    }
    
    lastFetchTime.current = now;
    
    // Only show loading state on initial load or forced refresh
    if (!initialLoadDone.current || force) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('Fetching clients data with searchQuery:', searchQuery);
      
      // First try to get from ai_agents table for config entries
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
      if (searchQuery) {
        // We need to use ilike for case-insensitive search and handle multiple fields
        query = query.or(`name.ilike.%${searchQuery}%,client_id.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`);
      }
      
      const { data: agentData, error: agentError } = await query;
      
      if (agentError) {
        console.error('Error fetching from ai_agents:', agentError);
        throw agentError;
      }
      
      console.log(`Fetched ${agentData?.length || 0} records from ai_agents`);
      
      // If we don't have any data from ai_agents, try the clients table as fallback
      if (!agentData || agentData.length === 0) {
        console.log('No data in ai_agents, checking clients table');
        let clientsQuery = supabase.from('clients').select('*');
        
        if (searchQuery) {
          clientsQuery = clientsQuery.or(`client_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        
        const { data: clientsData, error: clientsError } = await clientsQuery;
        
        if (clientsError) {
          console.error('Error fetching from clients:', clientsError);
          throw clientsError;
        }
        
        console.log(`Fetched ${clientsData?.length || 0} records from clients table`);
        
        // Convert clients data to Client type
        const formattedClients: Client[] = (clientsData || []).map(client => {
          // Parse widget settings to ensure it's an object
          const widgetSettings = safeParseSettings(client.widget_settings);
          
          return {
            id: client.id,
            client_id: client.id,
            client_name: client.client_name || 'Unnamed Client',
            email: client.email || '',
            company: client.company || '',
            description: client.description || '',
            status: client.status || 'active',
            created_at: client.created_at || '',
            updated_at: client.updated_at || '',
            deleted_at: client.deleted_at || null,
            deletion_scheduled_at: client.deletion_scheduled_at || null,
            last_active: client.last_active || null,
            logo_url: client.logo_url || '',
            logo_storage_path: client.logo_storage_path || '',
            agent_name: client.agent_name || 'AI Assistant',
            agent_description: '',
            widget_settings: widgetSettings,
            name: client.client_name || 'Unnamed Client',
            is_error: false,
            user_id: client.user_id || '',
            openai_assistant_id: client.openai_assistant_id || undefined
          };
        });
        
        // Filter out deleted clients
        const filteredClients = formattedClients.filter(client => 
          client.status !== 'scheduled_deletion' && 
          !client.deletion_scheduled_at &&
          client.status !== 'deleted'
        );
        
        setClients(filteredClients);
      } else {
        // Convert agent data to Client type
        const formattedClients: Client[] = agentData.map(agent => {
          // Use the safeParseSettings utility to ensure settings is always an object
          const parsedSettings = safeParseSettings(agent.settings);
          
          return {
            id: agent.id,
            client_id: agent.client_id || '',
            client_name: agent.client_name || parsedSettings.client_name || agent.name || 'Unnamed Client',
            email: agent.email || parsedSettings.email || '',
            status: agent.status || 'active',
            created_at: agent.created_at || '',
            updated_at: agent.updated_at || '',
            agent_name: agent.name || 'AI Assistant',
            agent_description: agent.agent_description || '',
            logo_url: agent.logo_url || parsedSettings.logo_url || '',
            widget_settings: parsedSettings,
            user_id: agent.user_id || parsedSettings.user_id || '',
            company: agent.company || parsedSettings.company || '',
            description: agent.description || parsedSettings.description || '',
            logo_storage_path: agent.logo_storage_path || parsedSettings.logo_storage_path || '',
            deletion_scheduled_at: agent.deletion_scheduled_at || null,
            deleted_at: agent.deleted_at || null,
            last_active: agent.last_active || null,
            name: agent.name || agent.client_name || 'Unnamed Client',
            is_error: agent.is_error || false,
            openai_assistant_id: agent.openai_assistant_id || parsedSettings.openai_assistant_id || undefined
          };
        });
        
        // Filter out clients with "Deletion Scheduled" status or those that have deletion_scheduled_at set
        const filteredClients = formattedClients.filter(client => 
          client.status !== 'scheduled_deletion' && 
          !client.deletion_scheduled_at &&
          client.status !== 'deleted'
        );
        
        console.log(`Processed ${filteredClients.length} clients`);
        setClients(filteredClients);
      }
      
      initialLoadDone.current = true;
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);
  
  // Initial fetch on component mount
  useEffect(() => {
    console.log('Initial client list fetch');
    fetchClients(true);
  }, [fetchClients]);
  
  // Set up refetch on window focus and auth state restoration
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only refetch if it's been more than 30 seconds since the last fetch
        if (now - lastFetchTime.current > 30000) {
          console.log('Document became visible - refetching clients');
          fetchClients();
        } else {
          console.log('Document became visible, but skipping refetch (fetched recently)');
        }
      }
    };
    
    const handleAuthStateRestored = () => {
      console.log('Auth state restored - refetching clients');
      fetchClients();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('authStateRestored', handleAuthStateRestored);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('authStateRestored', handleAuthStateRestored);
    };
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
