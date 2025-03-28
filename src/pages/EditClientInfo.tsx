
import React, { useEffect } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    if (clientId) {
      console.log("Client data loaded:", client);
    }
  }, [client, clientId]);

  const handleSubmit = async (data: ClientFormData) => {
    if (!clientId) {
      toast.error("No client ID available for update");
      return;
    }
    
    try {
      console.log("Submitting form data:", data);
      
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

  // Function to handle the retry button click
  const handleRetry = () => {
    refetchClient();
  };

  // Error state UI
  const renderErrorState = () => (
    <div className="bg-destructive/10 text-destructive p-6 rounded-md mt-6 flex flex-col items-center">
      <AlertTriangle className="h-12 w-12 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Error Loading Client Data</h3>
      <p className="text-center mb-4">We couldn't load this client's information. The client may not exist or there might be an issue with the connection.</p>
      <p className="text-sm opacity-80 mb-4">
        Error details: {error instanceof Error ? error.message : String(error)}
      </p>
      <Button onClick={handleRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );

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

      {isLoadingClient ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
          <span>Loading client information...</span>
        </div>
      ) : error ? (
        renderErrorState()
      ) : !client ? (
        <div className="bg-orange-100 text-orange-800 p-6 rounded-md mt-6">
          <h3 className="text-lg font-semibold mb-2">Client Not Found</h3>
          <p>We couldn't find the client with ID: {id}</p>
        </div>
      ) : (
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
              {clientId ? (
                <ClientResourceSections 
                  clientId={clientId} 
                  logClientActivity={logClientActivity}
                />
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                  Client ID is required to manage resources
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default EditClientInfo;
