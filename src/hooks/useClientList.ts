
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchClients } from '@/services/clientService';
import { Client } from '@/types/client';

export const useClientList = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  
  // Use React Query with improved caching
  const { 
    data: clients = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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
