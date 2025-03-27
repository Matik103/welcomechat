
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddClientModal } from '@/components/client/AddClientModal';

export default function AdminClientsPage() {
  const { clients, isLoading, searchQuery, handleSearch } = useClientList();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Manage Clients</h1>
          <Button 
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
        <p className="text-muted-foreground mb-6">Admin client management interface.</p>
        
        <div className="space-y-6">
          <ClientSearchBar 
            value={searchQuery} 
            onChange={handleSearch} 
          />
          
          <div className="bg-white rounded-md shadow">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : (
              <ClientListTable
                clients={clients}
                onDeleteClick={() => {
                  toast.info("Client deletion has been disabled");
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
      />
    </AdminLayout>
  );
}
