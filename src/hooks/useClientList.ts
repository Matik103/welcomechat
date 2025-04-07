
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';
import { toast } from 'sonner';

// Helper function to safely get a value from settings or return a default
const getSettingValue = <T>(settings: Record<string, any>, key: string, defaultValue: T): T => {
  if (!settings) return defaultValue;
  return settings[key] !== undefined ? settings[key] : defaultValue;
};

export const useClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const lastFetchTime = useRef<number>(0);
  const initialLoadDone = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchClients = useCallback(async (force = false) => {
    // Don't refetch if we just did within the last 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 5000) {
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
      console.log('Fetching clients data...');
      
      // Cancel any previous ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Set a timeout to show error after 20 seconds (increased from 10)
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = window.setTimeout(() => {
        if (isLoading) {
          console.error('Client fetch timeout reached');
          setError(new Error('Request timed out. Please try again.'));
          setIsLoading(false);
          toast.error('Failed to load clients: Request timed out');
          
          // Abort the ongoing request if it's still in progress
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }
      }, 20000) as unknown as number; // Increased timeout from 10s to 20s
      
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      // Clear the timeout since we got a response
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (error) {
        throw error;
      }
      
      // Convert to Client type
      const formattedClients: Client[] = data.map(agent => {
        // Use the safeParseSettings utility to ensure widget_settings is always an object
        const parsedSettings = safeParseSettings(agent.settings);
        
        return {
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
          widget_settings: parsedSettings,
          // Add missing properties with default values
          user_id: '',
          company: agent.company || '',
          description: agent.description || '',
          logo_storage_path: agent.logo_storage_path || '',
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          deleted_at: agent.deleted_at || null,
          last_active: agent.last_active || null,
          name: agent.name || '',
          is_error: agent.is_error || false
        };
      });
      
      // Filter out clients with "Deletion Scheduled" status or those that have deletion_scheduled_at set
      const filteredClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );
      
      console.log(`Fetched ${filteredClients.length} clients successfully`);
      setClients(filteredClients);
      initialLoadDone.current = true;
    } catch (error) {
      // Ignore aborted request errors
      if (error.name === 'AbortError') {
        console.log('Request was aborted', error);
        return;
      }
      
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch clients'));
      toast.error(`Failed to load clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isLoading]);
  
  // Initial fetch on component mount with retry logic
  useEffect(() => {
    const attemptFetch = async () => {
      try {
        await fetchClients(true);
      } catch (err) {
        console.error("Initial client fetch failed, retrying...", err);
        
        // Retry after a delay if initial fetch fails
        setTimeout(() => {
          fetchClients(true).catch(retryErr => {
            console.error("Retry fetch failed:", retryErr);
          });
        }, 3000);
      }
    };
    
    attemptFetch();
    
    return () => {
      // Clean up timeouts and abort controllers if component unmounts
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
  
  // Add a manual retry function that forces a refresh
  const retryFetch = () => {
    setError(null);
    return fetchClients(true);
  };
  
  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch: fetchClients,
    retry: retryFetch
  };
};
