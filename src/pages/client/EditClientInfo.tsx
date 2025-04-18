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
  const [activeTab, setActiveTab] = useState('profile');
  
  // Get client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient
  } = useClientData(clientId);

  // For debugging - log what we have
  useEffect(() => {
    console.log("User metadata:", user?.user_metadata);
    console.log("Client ID from metadata:", clientId);
    console.log("Current client state:", { client, isLoadingClient, error });
  }, [user, clientId, client, isLoadingClient, error]);

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
      
      // Extract the current widget settings to retain all values
      const currentWidgetSettings = client.widget_settings || {};
      
      await clientMutation.mutateAsync({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        // Update widget settings with new values while keeping other settings
        widget_settings: {
          ...(typeof currentWidgetSettings === 'object' ? currentWidgetSettings : {}),
          agent_name: data.agent_name,
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        },
        company: client.company || '',
        description: client.description || '',
        status: client.status || 'active',
        created_at: client.created_at,
        updated_at: new Date().toISOString(),
        deleted_at: client.deleted_at,
        deletion_scheduled_at: client.deletion_scheduled_at,
        last_active: client.last_active,
        is_error: false
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

  // Show error if no client ID in metadata
  if (!clientId) {
    return (
      <ClientLayout>
        <ErrorDisplay 
          title="Access Error"
          message="Unable to find your client ID. Please make sure you're properly logged in."
          details="If this issue persists, please contact support."
          onRetry={() => window.location.reload()}
        />
      </ClientLayout>
    );
  }

  // Show error if client data failed to load
  if (error && !client) {
    return (
      <ClientLayout>
        <ErrorDisplay 
          title="Error Loading Your Information"
          message={`Unable to load your information: ${error instanceof Error ? error.message : String(error)}`}
          details={`Client ID: ${clientId}`}
          onRetry={refetchClient}
        />
      </ClientLayout>
    );
  }

  const logActivityWrapper = async (): Promise<void> => {
    if (!client) return;
    
    const clientName = client.client_name || client.agent_name || "Unknown";
    await logClientActivity("client_updated", 
      `Profile information updated for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: client.agent_name
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
          Edit Your Information
          <p className="text-sm font-normal text-muted-foreground">
            Update your details and manage your resources
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
                      isClientView={true}
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
                {clientId && (
                  <ClientResourceSections 
                    clientId={clientId}
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
