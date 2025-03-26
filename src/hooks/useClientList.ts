
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  const { 
    data: clients, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      try {
        console.log("Fetching clients from ai_agents table...");
        
        const { data: agentsData, error: supabaseError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('interaction_type', 'config')
          .not('status', 'eq', 'deleted')
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error("Supabase query error:", supabaseError);
          throw supabaseError;
        }
        
        console.log(`Fetched ${agentsData?.length || 0} clients from ai_agents:`, agentsData);
        
        if (!agentsData || !Array.isArray(agentsData) || agentsData.length === 0) {
          console.log("No clients found in ai_agents table");
          return [];
        }
        
        const clientMap = new Map<string, any>();
        
        agentsData.forEach(record => {
          const clientId = record.client_id || record.id;
          
          if (!clientMap.has(clientId) || 
              new Date(record.created_at) > new Date(clientMap.get(clientId).created_at)) {
            clientMap.set(clientId, record);
          }
        });
        
        const uniqueClients = Array.from(clientMap.values());
        console.log(`Processed ${uniqueClients.length} unique clients`);
        
        const mappedClients = uniqueClients.map((record: any) => {
          const settings = typeof record.settings === 'object' ? record.settings : {};
          const clientName = settings.client_name || record.client_name || record.name || 'Unnamed Client';
          const email = settings.email || record.email || '';
          
          const client: Client = {
            id: record.client_id || record.id,
            client_id: record.client_id || record.id,
            client_name: clientName,
            company: record.company || '',
            description: record.description || null,
            email: email, 
            status: (record.status === 'active' || record.status === 'inactive' || record.status === 'deleted') 
                    ? record.status 
                    : 'active',
            agent_name: record.name || '',
            name: record.name || '',
            agent_description: record.agent_description || '',
            widget_settings: settings,
            created_at: record.created_at || '',
            updated_at: record.updated_at || '',
            last_active: record.last_active || null,
            deleted_at: record.deleted_at || null,
            deletion_scheduled_at: record.deletion_scheduled_at || null,
            drive_link: record.drive_link || null,
            drive_link_added_at: record.drive_link_added_at || null,
            logo_url: record.logo_url || '',
            logo_storage_path: record.logo_storage_path || '',
            urls: record.urls || [],
            drive_urls: record.drive_urls || [],
            is_error: record.is_error || false,
            error_message: record.error_message || null,
            user_id: record.user_id || ''
          };
          
          console.log(`Client ${clientName}: id=${client.id}`);
          
          return client;
        });
        
        console.log("Total mapped clients:", mappedClients.length);
        return mappedClients;
      } catch (err) {
        console.error('Error fetching clients:', err);
        toast.error('Failed to load clients');
        return [];
      }
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Setup real-time subscriptions
  useEffect(() => {
    console.log("Setting up real-time subscription for ai_agents table...");
    
    const channel = supabase
      .channel('ai_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ai_agents',
          filter: 'interaction_type=eq.config'
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      console.log("Removing real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter clients based on search query
  useEffect(() => {
    if (clients && clients.length > 0) {
      console.log(`Filtering ${clients.length} clients with search query: "${searchQuery}"`);
      const filtered = clients.filter(client => {
        const searchLower = searchQuery.toLowerCase();
        return (
          client.client_name?.toLowerCase().includes(searchLower) ||
          client.agent_name?.toLowerCase().includes(searchLower) ||
          client.description?.toLowerCase().includes(searchLower) ||
          client.status?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          (client.id && client.id.toLowerCase().includes(searchLower))
        );
      });
      setFilteredClients(filtered);
    } else {
      console.log("No clients to filter");
      setFilteredClients([]);
    }
  }, [clients, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return {
    clients,
    filteredClients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch,
  };
};

export default useClientList;
