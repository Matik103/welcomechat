
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { AddClientModal } from '@/components/client/AddClientModal';
import { Client } from '@/types/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminClientsPage() {
  const { clients, isLoading, error, searchQuery, handleSearch, refetch, retry } = useClientList();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleDeleteClick = (client: Client) => {
    console.log('Delete clicked for client:', client.client_name);
    // Refetch after deletion
    refetch();
  };

  const handleRetryClick = async () => {
    setIsRetrying(true);
    toast.info("Retrying client data fetch...");
    try {
      await retry();
    } catch (error) {
      console.error("Error retrying fetch:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mb-6">Admin client management interface.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsAddClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </div>
        </div>
        
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
              disabled={isLoading || isRetrying}
              className="ml-2"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isRetrying) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription className="flex items-center justify-between">
                <span>Error loading clients: {error.message}</span>
                <Button variant="outline" size="sm" onClick={handleRetryClick} disabled={isRetrying}>
                  {isRetrying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white rounded-md shadow">
            {isLoading ? (
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
      
      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onClose={() => {
          setIsAddClientModalOpen(false);
          refetch(); // Refresh the client list after adding a new client
        }}
      />
    </AdminLayout>
  );
}
