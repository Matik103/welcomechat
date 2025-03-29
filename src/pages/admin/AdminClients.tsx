
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddClientModal } from '@/components/client/AddClientModal';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';
import { Client } from '@/types/client';

export default function AdminClientsPage() {
  const { clients, isLoading, searchQuery, handleSearch, refetch } = useClientList();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button 
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
        <p className="text-muted-foreground mb-6">Admin client management interface.</p>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <ClientSearchBar 
              value={searchQuery} 
              onChange={handleSearch} 
              className="w-full max-w-md"
            />
            <Button 
              onClick={() => setIsAddClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </div>
          
          <div className="bg-white rounded-md shadow">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : (
              <ClientListTable
                clients={clients}
                onDeleteClick={handleDeleteClick}
              />
            )}
          </div>
        </div>
      </div>
      
      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
      />

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        client={selectedClient}
        onClientsUpdated={refetch}
      />
    </AdminLayout>
  );
}
