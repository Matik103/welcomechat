
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
  const initialLoadDone = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<number | null>(null);
  const isMounted = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchClients = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 15000) {
      console.log('Skipping fetch - too soon after last fetch');
      return;
    }
    
    lastFetchTime.current = now;
    
    if (!initialLoadDone.current || force) {
      setIsLoading(true);
    }
    
    setError(null);
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('Fetching clients data...');
      
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      fetchTimeoutRef.current = window.setTimeout(() => {
        if (isLoading && isMounted.current) {
          console.error('Client fetch timeout reached');
          setError(new Error('Request timed out. Please try again.'));
          setIsLoading(false);
          toast.error('Failed to load clients: Request timed out');
        }
      }, 10000) as unknown as number;
      
      // Limit columns to only fetch what we need
      let query = supabase
        .from('ai_agents')
        .select('id, client_id, client_name, name, status, created_at, updated_at, last_active, settings, logo_url, description, email, deletion_scheduled_at')
        .eq('interaction_type', 'config');
      
      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No clients found or empty data array');
        setClients([]);
        initialLoadDone.current = true;
        setIsLoading(false);
        return;
      }
      
      // Process the data to ensure we only have unique clients with a more efficient algorithm
      const clientMap = new Map<string, any>();
      
      // Give priority to the most recently updated record for each client_id
      for (const agent of data) {
        const clientId = agent.client_id || agent.id;
        const existingAgent = clientMap.get(clientId);
        
        // If this is a newer record for the same client_id, or we don't have one yet, use this one
        if (!existingAgent || (existingAgent.updated_at < agent.updated_at)) {
          clientMap.set(clientId, agent);
        }
      }
      
      // Convert to array and process in a more efficient way
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
          // Only include essential properties, leave others as defaults
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
      
      const filteredClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );
      
      console.log(`Fetched ${filteredClients.length} clients successfully (${data.length} total records)`);
      
      if (isMounted.current) {
        setClients(filteredClients);
        initialLoadDone.current = true;
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      
      if (isMounted.current) {
        setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
        toast.error(`Failed to load clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    }
  }, [searchQuery, isLoading]);
  
  useEffect(() => {
    isMounted.current = true;
    fetchClients(true);
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchClients]);
  
  useEffect(() => {
    // Optimized visibility change handler with debounce
    let visibilityChangeTimeout: number | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any existing timeout
        if (visibilityChangeTimeout) {
          window.clearTimeout(visibilityChangeTimeout);
        }
        
        // Set a new timeout
        visibilityChangeTimeout = window.setTimeout(() => {
          const now = Date.now();
          if (now - lastFetchTime.current > 30000) {
            console.log('Document became visible - refetching clients');
            fetchClients();
          } else {
            console.log('Document became visible, but skipping refetch (fetched recently)');
          }
        }, 300) as unknown as number;
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
      if (visibilityChangeTimeout) {
        window.clearTimeout(visibilityChangeTimeout);
      }
    };
  }, [fetchClients]);
  
  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch: (value: string) => setSearchQuery(value),
    refetch: fetchClients
  };
};
