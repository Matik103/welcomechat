
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';

/**
 * Custom hook for fetching and managing client list data
 */
export const useClientList = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  
  // Function to fetch clients from Supabase
  const fetchClients = async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('interaction_type', 'config')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
    
    return (data || []) as Client[];
  };
  
  // Use React Query with proper configuration
  const { 
    data: clients = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - replaced deprecated cacheTime
    refetchOnWindowFocus: false,
  });
  
  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = clients.filter((client) => {
      return (
        client.client_name?.toLowerCase().includes(lowercaseQuery) ||
        client.contact_email?.toLowerCase().includes(lowercaseQuery) ||
        client.agent_name?.toLowerCase().includes(lowercaseQuery)
      );
    });
    
    setFilteredClients(filtered);
  }, [searchQuery, clients]);
  
  // Handle search input change
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  return {
    clients: filteredClients,
    allClients: clients,
    isLoading,
    searchQuery,
    handleSearch,
    refetch
  };
};
