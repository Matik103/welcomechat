
import React, { useState } from 'react';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { ClientListTable } from '@/components/client/ClientListTable';
import { useClientList } from '@/hooks/useClientList';
import { toast } from 'sonner';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';

export default function ClientList() {
  const { clients, isLoading, searchQuery, handleSearch, refetch } = useClientList();
  
  const handleDeleteClick = async (client: Client) => {
    console.log('Delete clicked for client:', client.client_name);
    
    try {
      // Mark as deleted in our database
      const { error } = await supabase
        .from('ai_agents')
        .update({ 
          status: 'deleted',
          deletion_scheduled_at: new Date().toISOString()
        })
        .eq('id', client.id);
      
      if (error) throw error;
      
      toast.success(`Scheduled ${client.client_name} for deletion`);
      refetch(); // Refresh the list
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Failed to delete client. Please try again.');
    }
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
    </div>
  );
}
