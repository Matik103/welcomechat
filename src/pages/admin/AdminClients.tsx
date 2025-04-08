
import React, { useState, useCallback, Suspense, lazy } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Client } from '@/types/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Use lazy loading for the modal to improve initial page load time
const AddClientModal = lazy(() => import('@/components/client/AddClientModal').then(
  module => ({ default: module.AddClientModal })
));

export default function AdminClientsPage() {
  const { clients, isLoading, error, searchQuery, handleSearch, refetch } = useClientList();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const handleDeleteClick = useCallback((client: Client) => {
    console.log('Delete clicked for client:', client.client_name);
    // Refetch after deletion
    refetch();
  }, [refetch]);

  const handleRetryClick = useCallback(() => {
    toast.info("Retrying client data fetch...");
    refetch(true);
  }, [refetch]);

  const handleAddClientClose = useCallback(() => {
    setIsAddClientModalOpen(false);
    refetch(); // Refresh the client list after adding a new client
  }, [refetch]);

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Clients</h1>
          <Button 
            onClick={() => setIsAddClientModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Client
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
              variant="outline"
              onClick={handleRetryClick}
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>Error loading clients: {error.message}</span>
                <Button variant="outline" size="sm" onClick={handleRetryClick}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white rounded-md shadow">
            {isLoading && clients.length === 0 ? (
              <div className="p-8 flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : clients.length === 0 && !error ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No clients found</p>
                <Button 
                  onClick={() => setIsAddClientModalOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Client
                </Button>
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
      
      {isAddClientModalOpen && (
        <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
          <AddClientModal 
            isOpen={isAddClientModalOpen}
            onClose={handleAddClientClose}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
}
