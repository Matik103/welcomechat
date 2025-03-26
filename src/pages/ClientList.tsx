
import React from 'react';
import { ClientListContainer } from '@/components/client/ClientListContainer';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';

export default function ClientList() {
  const { clients, isLoading, error, refetch, searchQuery, handleSearch } = useClientList();
  const { goToCreateClient } = useNavigation();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Button onClick={goToCreateClient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
        
        <ClientSearchBar 
          searchQuery={searchQuery} 
          onSearchChange={handleSearch} 
        />
        
        <ClientListContainer>
          <ClientListTable
            clients={clients}
            isLoading={isLoading}
            error={error}
            onRefresh={refetch}
          />
        </ClientListContainer>
      </div>
    </div>
  );
}
