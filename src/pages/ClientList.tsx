
import React from 'react';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { toast } from 'sonner';

export default function ClientList() {
  const { clients, isLoading, searchQuery, handleSearch } = useClientList();

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clients</h1>
        </div>
        
        <ClientSearchBar 
          value={searchQuery} 
          onChange={handleSearch} 
        />
        
        <div className="bg-white rounded-md shadow">
          <ClientListTable
            clients={clients}
            onDeleteClick={() => toast.info("Client deletion has been disabled")}
          />
        </div>
      </div>
    </div>
  );
}
