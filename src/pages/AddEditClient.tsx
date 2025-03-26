
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/client/ClientForm';
import { useClientMutation } from '@/hooks/useClientMutation';
import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/services/clientService'; // Using getClient instead of getClientById
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ClientFormData } from '@/types/client-form';

export default function AddEditClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const isEditing = !!clientId;
  const mutation = useClientMutation();
  
  // Fetch client data if editing
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? getClient(clientId) : null,
    enabled: isEditing,
  });

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await mutation.mutateAsync({
        ...data,
        client_id: isEditing ? clientId : undefined
      });
      
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin/clients');
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Edit Client' : 'Add New Client'}
        </h1>
        
        {isLoadingClient && isEditing ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          </div>
        ) : (
          <ClientForm 
            initialData={client || {}}
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
