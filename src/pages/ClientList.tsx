
import { useState } from 'react';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Client } from '@/types/client';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';
import { ErrorDisplay } from '@/components/client/ErrorDisplay';
import { ClientListContainer } from '@/components/client/ClientListContainer';
import { useClientList } from '@/hooks/useClientList';

export default function ClientList() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const {
    clients,
    isLoading,
    error,
    searchQuery,
    handleSearch,
    refetch
  } = useClientList();

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleClientsUpdated = () => {
    refetch();
  };

  if (error) {
    return <ErrorDisplay />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <PageHeading>
          Client Management
          <p className="text-sm font-normal text-muted-foreground">
            View and manage all your clients
          </p>
        </PageHeading>
      </div>

      <ClientListContainer
        clients={clients}
        filteredClients={clients}
        isLoading={isLoading}
        searchQuery={searchQuery || ''}
        onSearch={handleSearch}
        onDeleteClick={handleDeleteClient}
      />

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        client={selectedClient}
        onClientsUpdated={handleClientsUpdated}
      />
    </div>
  );
}
