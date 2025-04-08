
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
    // Clear any existing timeout to prevent multiple fetches
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Cancel any previous ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config');

      if (searchQuery) {
        query = query.or(`client_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!isMountedRef.current) return;

      if (error) throw error;
      if (!data) throw new Error('No data received from the server');

      const formattedClients: Client[] = data.map(agent => ({
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
        widget_settings: safeParseSettings(agent.settings),
        name: agent.name || '',
        is_error: agent.is_error || false,
        openai_assistant_id: agent.openai_assistant_id || undefined,
        deepseek_assistant_id: agent.deepseek_assistant_id || undefined,
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
        metadata: ensureObjectMetadata(agent.metadata),
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
        website_url_refresh_rate: agent.website_url_refresh_rate || null,
        website: agent.website || '',
        phone: agent.phone || '',
        address: agent.address || ''
      }));

      const filteredClients = formattedClients.filter(client => 
        client.status !== 'scheduled_deletion' && 
        !client.deletion_scheduled_at
      );

      setState(prev => ({
        ...prev,
        clients: filteredClients,
        isLoading: false,
        error: null
      }));

    } catch (error: any) {
      if (!isMountedRef.current) return;
      if (error.name === 'AbortError') return;

      console.error('Error fetching clients:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to fetch clients'),
        isLoading: false
      }));
      toast.error(`Failed to load clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Add retry mechanism with exponential backoff for failed fetches
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          retry();
        }
      }, 5000);
    }
  }, [searchQuery]);

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
