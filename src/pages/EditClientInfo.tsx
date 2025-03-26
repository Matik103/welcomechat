
import React from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { ClientFormData, ActivityType } from '@/types/client-form';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';

export default function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(id);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      await clientMutation.mutateAsync(data);
      
      if (clientId) {
        await createClientActivity(
          clientId,
          'client_updated' as ActivityType,
          `Updated client information`,
          { fields_updated: Object.keys(data) }
        );
      }
      
      toast.success("Client information updated successfully");
      refetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client information");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeading>
        Edit Client Information
        <p className="text-sm font-normal text-muted-foreground">
          Update client details and settings
        </p>
      </PageHeading>

      <div className="mt-6">
        <ClientForm 
          initialValues={client}
          onSubmit={handleSubmit}
          isLoading={isLoadingClient || clientMutation.isPending}
          error={error || clientMutation.error?.message}
          submitButtonText="Update Client"
        />
      </div>
    </div>
  );
}
