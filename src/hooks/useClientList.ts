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
  const loadingTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const fetchWithRetry = async (query: any, retryCount = 0): Promise<any> => {
    try {
      const { data, error } = await Promise.race([
        query,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        )
      ]);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        console.log(`Retrying... Attempt ${retryCount + 2}`);
        return fetchWithRetry(query, retryCount + 1);
      }
      
      throw error;
    }
  };

  const fetchClients = useCallback(async (force = false) => {
    // Don't refetch if we just did within the last 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 5000) {
      console.log('Skipping fetch - too soon after last fetch');
      return;
    }
    
    lastFetchTime.current = now;
    retryCountRef.current = 0;
    
    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }
    
    // Only show loading state after a small delay to prevent flicker on fast loads
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (!initialLoadDone.current || force) {
        setIsLoading(true);
      }
    }, 200) as unknown as number;
    
    setError(null);
    
    try {
      console.log('Fetching clients data...');
      
      // Cancel any previous ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');
      
      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await fetchWithRetry(query);
      
      // Clear all timeouts since we got a response
      if (fetchTimeoutRef.current) {
        window.clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to fetch clients');
      }
      
      if (!data) {
        throw new Error('No data received from the server');
      }

      // Log the first item to see its structure
      if (data.length > 0) {
        console.log('First agent data structure:', JSON.stringify(data[0], null, 2));
      }
      
      // Convert to Client type
      const formattedClients: Client[] = data.map(agent => {
        const parsedSettings = safeParseSettings(agent.settings);
        
        return {
          // Required fields from Client interface
          id: agent.id,
          client_id: agent.client_id || '',
          client_name: agent.client_name || '',
          email: agent.email || '',
          company: agent.company || '',
          description: agent.description || '',
          status: agent.status || 'active',
          created_at: agent.created_at || '',
          updated_at: agent.updated_at || '',
          deleted_at: agent.deleted_at || null,
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          last_active: agent.last_active || null,
          logo_url: agent.logo_url || '',
          logo_storage_path: agent.logo_storage_path || '',
          agent_name: agent.name || '',
          agent_description: agent.agent_description || '',
          widget_settings: parsedSettings,
          name: agent.name || '',
          is_error: agent.is_error || false,
          openai_assistant_id: agent.openai_assistant_id || undefined,
          
          // Additional fields from ai_agents
          ai_prompt: agent.ai_prompt || '',
          assistant_id: agent.assistant_id || '',
          content: agent.content || '',
          document_id: agent.document_id || null,
          drive_link: agent.drive_link || '',
          drive_link_added_at: agent.drive_link_added_at || null,
          drive_link_refresh_rate: agent.drive_link_refresh_rate || null,
          drive_urls: agent.drive_urls || [],
          embedding: agent.embedding || null,
          error_message: agent.error_message || '',
          error_status: agent.error_status || '',
          error_type: agent.error_type || '',
          interaction_type: agent.interaction_type || '',
          is_active: agent.is_active || false,
          metadata: agent.metadata || {},
          model: agent.model || '',
          query_text: agent.query_text || '',
          response_time_ms: agent.response_time_ms || null,
          sentiment: agent.sentiment || '',
          size: agent.size || null,
          topic: agent.topic || '',
          type: agent.type || '',
          uploadDate: agent.uploadDate || '',
          url: agent.url || '',
          urls: agent.urls || [],
          website_url_refresh_rate: agent.website_url_refresh_rate || null
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
      // Clear loading timeout if it exists
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
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
      
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
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
