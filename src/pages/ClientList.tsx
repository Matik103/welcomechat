
import React from 'react';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientList() {
  const { clients, isLoading, searchQuery, handleSearch } = useClientList();

  const handleAddClientClick = () => {
    toast.info("Client creation has been disabled");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Button variant="outline" onClick={handleAddClientClick} disabled>
            Client Creation Disabled
          </Button>
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
