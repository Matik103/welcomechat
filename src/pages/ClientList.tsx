
import React, { useState } from 'react';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';
import { Client } from '@/types/client';

export default function ClientList() {
  const { clients, isLoading, searchQuery, handleSearch, refetch } = useClientList();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

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
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

      <DeleteClientDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        client={selectedClient}
        onClientsUpdated={refetch}
      />
    </div>
  );
}
