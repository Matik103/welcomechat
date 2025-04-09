
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';
import { toast } from 'sonner';

export const useClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const lastFetchTime = useRef<number>(0);
  const isMounted = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cachedClients = useRef<Map<string, Client>>(new Map());

  // Use a debounced search to prevent excessive DB queries
  const debouncedSearchRef = useRef<number | null>(null);
  
  const fetchClients = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Debugging information for cache state
    console.log(`Cache status: ${cachedClients.current.size} clients cached, last fetch: ${new Date(lastFetchTime.current).toISOString()}`);
    console.log(`Force refresh: ${force}, Time since last fetch: ${(now - lastFetchTime.current) / 1000}s`);
    
    // Don't fetch if we've fetched recently, unless forced
    if (!force && now - lastFetchTime.current < 10000 && cachedClients.current.size > 0) {
      console.log('Using cached client data (less than 10s since last fetch)');
      return;
    }
    
    // Always update the last fetch time
    lastFetchTime.current = now;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('Aborting previous fetch request');
    }
    
    abortControllerRef.current = new AbortController();
    
    // Only show loading state on initial load or forced refresh
    if (!cachedClients.current.size || force) {
      setIsLoading(true);
      console.log('Setting loading state to true');
    }
    
    setError(null);
    
    try {
      console.log('Fetching clients data...');
      toast.info('Fetching client data...', { id: 'fetch-clients' });
      
      // Simpler query - don't overcomplicate
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      
      if (agentsError) {
        throw agentsError;
      }
      
      if (!agentsData || agentsData.length === 0) {
        console.log('No clients found in database');
        setClients([]);
        setIsLoading(false);
        toast.dismiss('fetch-clients');
        return;
      }

      console.log(`Fetched ${agentsData.length} client records from database`);
      
      // Filter by search query if provided
      let filteredAgents = agentsData;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredAgents = agentsData.filter(agent => 
          (agent.client_name && agent.client_name.toLowerCase().includes(searchLower)) ||
          (agent.name && agent.name.toLowerCase().includes(searchLower)) ||
          (agent.email && agent.email.toLowerCase().includes(searchLower))
        );
        console.log(`Filtered to ${filteredAgents.length} clients matching search: "${searchQuery}"`);
      }
      
      // Process data into client objects
      const clientMap = new Map<string, any>();
      
      for (const agent of filteredAgents) {
        const clientId = agent.client_id || agent.id;
        if (!clientMap.has(clientId) || (clientMap.get(clientId).updated_at < agent.updated_at)) {
          clientMap.set(clientId, agent);
        }
      }
      
      // Convert to array of client objects
      const formattedClients: Client[] = Array.from(clientMap.values()).map(agent => {
        const parsedSettings = safeParseSettings(agent.settings);
        
        return {
          id: agent.id,
          client_id: agent.client_id || agent.id,
          client_name: agent.client_name || parsedSettings.client_name || '',
          email: agent.email || parsedSettings.email || '',
          status: agent.status as 'active' | 'inactive' | 'deleted' || 'active',
          created_at: agent.created_at || new Date().toISOString(),
          updated_at: agent.updated_at || new Date().toISOString(),
          agent_name: agent.name || '',
          logo_url: agent.logo_url || '',
          description: agent.description || '',
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          last_active: agent.last_active || null,
          deleted_at: null,
          user_id: parsedSettings.user_id || '',
          company: '',
          agent_description: '',
          logo_storage_path: '',
          widget_settings: {},
          name: agent.name || '',
          is_error: false
        };
      });
      
      // Filter deleted clients
      const finalClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );
      
      console.log(`Processed ${finalClients.length} valid clients`);
      
      // Update cache
      cachedClients.current.clear();
      finalClients.forEach(client => {
        cachedClients.current.set(client.client_id, client);
      });
      
      if (isMounted.current) {
        setClients(finalClients);
        setIsLoading(false);
        toast.dismiss('fetch-clients');
        toast.success(`Loaded ${finalClients.length} clients`);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.dismiss('fetch-clients');
      toast.error('Failed to load clients');
      
      // Use cached data if available, even on error
      if (cachedClients.current.size > 0) {
        const cachedClientsList = Array.from(cachedClients.current.values());
        console.log(`Using ${cachedClientsList.length} cached clients due to fetch error`);
        setClients(cachedClientsList);
        setError(new Error('Showing cached clients. Refresh failed: ' + (error instanceof Error ? error.message : 'Unknown error')));
      } else {
        setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
      }
      
      setIsLoading(false);
    }
  }, [searchQuery]);
  
  // Debounced search implementation
  const handleSearch = useCallback((value: string) => {
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    
    debouncedSearchRef.current = window.setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);
  
  // Initial fetch and cleanup
  useEffect(() => {
    isMounted.current = true;
    console.log('useClientList hook initialized, fetching clients');
    fetchClients(true);
    
    return () => {
      console.log('useClientList hook unmounting, cleaning up');
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }
    };
  }, [fetchClients]);
  
  // Add effect to refetch when search query changes
  useEffect(() => {
    console.log(`Search query changed to: "${searchQuery}"`);
    if (searchQuery !== '') {
      fetchClients(true);
    }
  }, [searchQuery, fetchClients]);
  
  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch: fetchClients
  };
};
