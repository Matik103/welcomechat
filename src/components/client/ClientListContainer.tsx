
import React, { useState } from 'react';
import { ClientListTable } from '@/components/client/ClientListTable';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { Loader2 } from 'lucide-react';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientListContainerProps {
  clients: Client[];
  filteredClients: Client[];
  isLoading: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  onDeleteClick: (client: Client) => void;
}

export const ClientListContainer: React.FC<ClientListContainerProps> = ({
  clients,
  filteredClients,
  isLoading,
  searchQuery,
  onSearch,
  onDeleteClick,
}) => {
  const navigate = useNavigate();

  const handleAddClientClick = () => {
    navigate('/admin/clients/new');
  };

  return (
    <>
      <div className="flex gap-2 justify-end mb-6">
        <Button className="flex items-center gap-2" onClick={handleAddClientClick}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <ClientSearchBar 
        onSearch={onSearch} 
        className="mb-6" 
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClientListTable 
          clients={filteredClients} 
          onDeleteClick={onDeleteClick} 
        />
      )}

      {!isLoading && filteredClients.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? "No clients match your search. Try a different search term."
              : "You haven't added any clients yet."}
          </p>
          {!searchQuery && (
            <Button onClick={handleAddClientClick}>
              Add Your First Client
            </Button>
          )}
        </div>
      )}

      {clients && clients.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredClients.length} of {clients.length} clients
          {searchQuery && <span> (filtered by "{searchQuery}")</span>}
        </div>
      )}
    </>
  );
};

export default ClientListContainer;
