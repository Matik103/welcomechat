
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
  const isMounted = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cachedClients = useRef<Map<string, Client>>(new Map());

  // Use a debounced search to prevent excessive DB queries
  const debouncedSearchRef = useRef<number | null>(null);
  
  const fetchClients = useCallback(async (force = false) => {
    const now = Date.now();
    // Don't fetch if we've fetched recently, unless forced
    if (!force && now - lastFetchTime.current < 30000 && cachedClients.current.size > 0) {
      console.log('Using cached client data');
      return;
    }
    
    lastFetchTime.current = now;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Only show loading state on initial load or forced refresh
    if (!cachedClients.current.size || force) {
      setIsLoading(true);
    }
    
    setError(null);
    
    // Set a timeout to show error if fetch takes too long
    const timeoutId = setTimeout(() => {
      if (isLoading && isMounted.current) {
        setError(new Error('Request timed out. Please try again.'));
        setIsLoading(false);
      }
    }, 20000); // Shorter timeout - 20 seconds instead of 8000ms
    
    try {
      console.log('Fetching clients data...');
      
      // Optimize the query - select only essential fields, implement pagination
      const query = supabase
        .from('ai_agents')
        .select('id, client_id, client_name, name, status, created_at, updated_at, last_active, logo_url, description, email, deletion_scheduled_at')
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        // Add limiting to improve initial load time
        .limit(50);
      
      // Apply search filter if provided
      if (searchQuery) {
        query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      clearTimeout(timeoutId);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No clients found or empty data array');
        setClients([]);
        setIsLoading(false);
        return;
      }
      
      // Process data more efficiently with a batch approach
      const clientMap = new Map<string, any>();
      
      // Simplified data processing - just take the data as is
      for (const agent of data) {
        const clientId = agent.client_id || agent.id;
        if (!clientMap.has(clientId) || (clientMap.get(clientId).updated_at < agent.updated_at)) {
          clientMap.set(clientId, agent);
        }
      }
      
      // Convert to array and process efficiently
      const formattedClients: Client[] = Array.from(clientMap.values()).map(agent => {
        const parsedSettings = safeParseSettings(agent.settings);
        
        // Create a simplified client object with only the essential properties
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
      const filteredClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );
      
      console.log(`Fetched ${filteredClients.length} clients successfully`);
      
      // Cache the results for faster future access
      cachedClients.current.clear(); // Clear previous cache
      filteredClients.forEach(client => {
        cachedClients.current.set(client.client_id, client);
      });
      
      if (isMounted.current) {
        setClients(filteredClients);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      clearTimeout(timeoutId);
      
      if (isMounted.current) {
        setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
        setIsLoading(false);
      }
    }
  }, [searchQuery, isLoading]);
  
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
    fetchClients(true);
    
    return () => {
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
