
import React from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';

export function EditClientInfo() {
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
      await clientMutation.mutateAsync({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description
      });
      
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
          initialData={client}
          onSubmit={handleSubmit}
          isLoading={isLoadingClient || clientMutation.isPending}
          error={error ? (error instanceof Error ? error.message : String(error)) : null}
          submitButtonText="Update Client"
        />
      </div>
    </div>
  );
}

export default EditClientInfo;
