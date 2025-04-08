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

// Helper function to ensure metadata is always an object
const ensureObjectMetadata = (metadata: any): Record<string, any> => {
  if (!metadata) return {};
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) return metadata;
  // Convert non-object metadata to an object with a value property
  return { value: metadata };
};

export const useClientList = () => {
  const [state, setState] = useState<{
    clients: Client[];
    isLoading: boolean;
    error: Error | null;
    searchQuery: string;
  }>({
    clients: [],
    isLoading: true,
    error: null,
    searchQuery: ''
  });

  const { clients, isLoading, error, searchQuery } = state;
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchClients = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Set a timeout to prevent infinite loading
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: new Error('Request timed out. Please try again.')
          }));
        }
      }, 30000); // 30 second timeout

      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          clients: data || [],
          isLoading: false,
          error: null
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch clients')
        }));
        toast.error('Failed to load clients. Please try again.');
      }
    } finally {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const retry = useCallback(async () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    return fetchClients(true);
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch: () => fetchClients(true),
    retry
  };
};
