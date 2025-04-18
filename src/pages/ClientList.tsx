import React, { useState, useCallback } from 'react';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { toast } from 'sonner';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { AddClientModal } from '@/components/client/AddClientModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientList() {
  const { clients, isLoading, error, searchQuery, handleSearch, refetch, retry } = useClientList();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleDeleteClick = useCallback((client: Client) => {
    console.log('Delete clicked for client:', client.client_name);
  }, []);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    toast.info("Refreshing client data...");
    try {
      await retry();
    } catch (error) {
      console.error("Error retrying fetch:", error);
    } finally {
      setIsRetrying(false);
    }
  }, [retry]);

  const handleAddClientClose = useCallback(() => {
    setIsAddClientModalOpen(false);
    refetch();
  }, [refetch]);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-6 min-h-[600px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your client accounts and settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isLoading || isRetrying}
              className="sm:ml-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isRetrying) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setIsAddClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load clients: {error.message}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <ClientSearchBar 
              value={searchQuery} 
              onChange={handleSearch}
              className="w-full" 
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            {clients.length === 0 && !error && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <p className="text-gray-500 mb-4">No clients found</p>
                <Button 
                  onClick={() => setIsAddClientModalOpen(true)}
                  variant="outline"
                  className="inline-flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Client
                </Button>
              </div>
            ) : (
              <ClientListTable
                clients={clients}
                onDeleteClick={handleDeleteClick}
                isLoading={isLoading}
              />
            )}
          </div>
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Loading clients...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddClientModal 
        isOpen={isAddClientModalOpen}
        onClose={handleAddClientClose}
      />
    </div>
  );
}
