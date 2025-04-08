import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';
import { toast } from 'sonner';

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
  const isMounted = useRef<boolean>(true);

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
      
      let query = supabase
        .from('ai_agents')
        .select('*')
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
      
      const formattedClients: Client[] = data.map(agent => {
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
          agent_description: agent.agent_description || '',
          logo_url: agent.logo_url || '',
          widget_settings: parsedSettings,
          user_id: parsedSettings.user_id || '',
          company: agent.company || '',
          description: agent.description || '',
          logo_storage_path: agent.logo_storage_path || '',
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          deleted_at: agent.deleted_at || null,
          last_active: agent.last_active || null,
          name: agent.name || '',
          is_error: agent.is_error || false,
          openai_assistant_id: agent.openai_assistant_id || undefined,
          deepseek_assistant_id: agent.deepseek_assistant_id || undefined
        };
      });
      
      const filteredClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );
      
      console.log(`Fetched ${filteredClients.length} clients successfully`);
      
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
    };
  }, [fetchClients]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
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
  
  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch: (value: string) => setSearchQuery(value),
    refetch: fetchClients
  };
};
