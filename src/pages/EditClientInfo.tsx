
import React, { useEffect } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  
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

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Function to log client activity
  const logClientActivity = async () => {
    try {
      // In a real implementation, we would log client activity
      // This is a placeholder for now
      console.log("Logging client activity for client:", clientId);
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging client activity:", error);
      return Promise.reject(error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 flex items-center gap-1"
        onClick={handleNavigateBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Button>
      
      <PageHeading>
        Edit Client Information
        <p className="text-sm font-normal text-muted-foreground">
          Update client details and manage resources
        </p>
      </PageHeading>

      <div className="mt-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <ClientForm 
              initialData={client}
              onSubmit={handleSubmit}
              isLoading={isLoadingClient || clientMutation.isPending}
              error={error ? (error instanceof Error ? error.message : String(error)) : null}
              submitButtonText="Update Client"
            />
          </TabsContent>
          
          <TabsContent value="resources">
            {clientId && (
              <ClientResourceSections 
                clientId={clientId} 
                logClientActivity={logClientActivity}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EditClientInfo;
