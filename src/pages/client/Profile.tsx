
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { useClientData } from '@/hooks/useClientData';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useNavigation } from '@/hooks/useNavigation';

export default function ClientProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const navigation = useNavigation();
  
  // Get client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId || '');

  // Log that we're attempting to fetch client data
  console.log("Attempting to fetch client data with ID:", clientId);
  console.log("User metadata:", user?.user_metadata);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient
  } = useClientData(clientId);

  // For debugging - log what we have
  useEffect(() => {
    console.log("Current client state:", { client, isLoadingClient, error });
  }, [client, isLoadingClient, error]);

  // If no user found or not authenticated, redirect to auth
  useEffect(() => {
    if (!user && !isLoadingClient) {
      console.log("No user found, redirecting to auth");
      navigation.goToAuth();
    }
  }, [user, isLoadingClient, navigation]);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (!clientId) {
        toast.error("Client ID not found in your user profile");
        return;
      }
      
      if (!client) {
        toast.error("Unable to load your client information");
        return;
      }
      
      console.log("Submitting update for client:", clientId);
      
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
      await logActivityWrapper();
      refetchClient();
    } catch (error) {
      console.error("Error updating client information:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      toast.error(`Failed to update your information: ${errorMessage}`);
    }
  };

  // Force a refetch if client is null but we have a clientId
  useEffect(() => {
    if (!client && !isLoadingClient && clientId && !error) {
      console.log("No client data but have clientId, forcing refetch for:", clientId);
      refetchClient();
    }
  }, [client, isLoadingClient, clientId, error, refetchClient]);

  // Show error if no client ID in metadata
  if (!clientId) {
    return (
      <div className="container mx-auto py-8">
        <ErrorDisplay 
          title="Access Error"
          message="Unable to find your client ID. Please make sure you're properly logged in."
          details="If this issue persists, please contact support."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Show error if client data failed to load
  if (error && !client) {
    return (
      <div className="container mx-auto py-8">
        <ErrorDisplay 
          title="Error Loading Your Information"
          message={`Unable to load your information: ${error instanceof Error ? error.message : String(error)}`}
          details={`Client ID: ${clientId}`}
          onRetry={refetchClient}
        />
      </div>
    );
  }

  const logActivityWrapper = async (): Promise<void> => {
    if (!client) return;
    
    const clientName = client.client_name || client.agent_name || "Unknown";
    await logClientActivity("profile_updated", 
      `Profile information updated for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: client.agent_name
      });
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeading>
        Profile
        <p className="text-sm font-normal text-muted-foreground">
          Update your information and manage your resources
        </p>
      </PageHeading>

      {isLoadingClient ? (
        <div className="mt-6 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your information...</p>
        </div>
      ) : !client ? (
        <div className="mt-6 p-8 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Information Not Found</h3>
          <p className="text-red-600">Unable to load your information. Please try again.</p>
          <button 
            onClick={refetchClient}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                submitButtonText="Update Information"
              />
            </TabsContent>
            
            <TabsContent value="resources">
              {clientId && (
                <ClientResourceSections 
                  clientId={clientId}
                  logClientActivity={logActivityWrapper}
                  onResourceChange={refetchClient}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
