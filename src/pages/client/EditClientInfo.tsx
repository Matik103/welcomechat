
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useClientData } from '@/hooks/useClientData';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientLayout } from '@/components/layout/ClientLayout';
import ErrorDisplay from '@/components/ErrorDisplay';
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { useClientActivity } from '@/hooks/useClientActivity';

export default function EditClientInfo() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = React.useState('profile');
  const { logClientActivity } = useClientActivity(user?.user_metadata?.client_id);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(user?.user_metadata?.client_id);

  // For debugging - log what we have
  useEffect(() => {
    console.log("User metadata:", user?.user_metadata);
    console.log("Current client state:", { client, isLoadingClient, error, clientId });
  }, [user, client, isLoadingClient, error, clientId]);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (!client) {
        toast.error("Client information not available");
        return;
      }
      
      // First try to use the client ID from the client object
      const updateClientId = client.id || client.client_id;
      
      if (!updateClientId) {
        toast.error("Client ID not found");
        return;
      }
      
      console.log("Submitting with client ID:", updateClientId);
      
      await clientMutation.mutateAsync({
        client_id: updateClientId,
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path
      });
      
      toast.success("Client information updated successfully");
      refetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      toast.error(`Failed to update client: ${errorMessage}`);
    }
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Force a refetch if client is null but we have a clientId
  useEffect(() => {
    if (!client && !isLoadingClient && clientId && !error) {
      console.log("No client data but have clientId, forcing refetch for:", clientId);
      refetchClient();
    }
  }, [client, isLoadingClient, clientId, error, refetchClient]);

  if (error && !client) {
    return (
      <ClientLayout>
        <ErrorDisplay 
          title="Error Loading Client"
          message={`Unable to load client data: ${error instanceof Error ? error.message : String(error)}`}
          details={`Client ID: ${clientId || 'unknown'}`}
          onRetry={refetchClient}
        />
      </ClientLayout>
    );
  }

  const logActivityWrapper = async (): Promise<void> => {
    const clientName = client?.client_name || client?.agent_name || "Unknown";
    await logClientActivity("client_updated", 
      `Client information updated for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: client?.agent_name
      });
  };

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 flex items-center gap-1"
          onClick={handleNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <PageHeading>
          Edit Client Information
          <p className="text-sm font-normal text-muted-foreground">
            Update your details and manage resources
          </p>
        </PageHeading>

        {isLoadingClient ? (
          <div className="mt-6 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading client information...</p>
          </div>
        ) : !client ? (
          <div className="mt-6 p-8 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Client data not found</h3>
            <p className="text-red-600">Unable to load client information. Client ID: {clientId || 'unknown'}</p>
            <Button 
              onClick={refetchClient} 
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Retry Loading
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ClientForm 
                      initialData={client}
                      onSubmit={handleSubmit}
                      isLoading={isLoadingClient || clientMutation.isPending}
                      error={error ? (error instanceof Error ? error.message : String(error)) : null}
                      submitButtonText="Update Information"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <ClientDetailsCard 
                      client={client} 
                      isLoading={isLoadingClient}
                      logClientActivity={logActivityWrapper}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    type="button" 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    onClick={() => setActiveTab('resources')}
                  >
                    Next: Resources <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="resources">
                {client && (
                  <ClientResourceSections 
                    clientId={client.id || client.client_id}
                    logClientActivity={logActivityWrapper}
                    onResourceChange={refetchClient}
                  />
                )}
                
                <div className="flex justify-start mt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab('profile')}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Profile
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
