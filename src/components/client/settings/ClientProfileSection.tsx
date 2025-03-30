
import { useState } from 'react';
import { ClientForm } from "@/components/client/ClientForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/types/client";
import { ClientFormData } from '@/types/client-form';
import { toast } from 'sonner';
import { UseMutationResult } from "@tanstack/react-query";

interface ClientProfileSectionProps {
  client: Client;
  clientMutation: UseMutationResult<any, Error, any, unknown>;
  refetchClient: () => Promise<any>;
}

export function ClientProfileSection({ 
  client, 
  clientMutation, 
  refetchClient 
}: ClientProfileSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true);
      
      const clientId = client.id || client.client_id;
      if (!clientId) {
        toast.error("Client ID not found");
        return;
      }
      
      await clientMutation.mutateAsync({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path
      });
      
      toast.success("Your information has been updated successfully");
      refetchClient();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ClientForm
          initialData={client}
          onSubmit={handleSubmit}
          isLoading={isSubmitting || clientMutation.isPending}
          submitButtonText="Save Changes"
        />
      </CardContent>
    </Card>
  );
}
