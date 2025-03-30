
import React, { useEffect, useState } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { useParams } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import ErrorDisplay from '@/components/ErrorDisplay';
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';

export function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [serviceKeyError, setServiceKeyError] = useState<boolean>(!isAdminClientConfigured());
  
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(id);

  useEffect(() => {
    if (error) {
      console.error("Error loading client data:", error);
      toast.error(`Error loading client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [error]);

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
      toast.error(`Failed to update client: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  const handleRetryServiceKey = () => {
    setServiceKeyError(!isAdminClientConfigured());
  };

  const logClientActivity = async () => {
    try {
      console.log("Logging client activity for client:", client?.id || clientId);
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging client activity:", error);
      return Promise.reject(error);
    }
  };

  if (serviceKeyError) {
    return (
      <ErrorDisplay 
        title="Supabase Service Role Key Missing"
        message="The Supabase service role key is missing or invalid. Logo upload functionality requires this key."
        details="To fix this issue, add your Supabase service role key to the .env file as VITE_SUPABASE_SERVICE_ROLE_KEY. This key is required for logo uploads and storage bucket management."
        onRetry={handleRetryServiceKey}
      />
    );
  }

  if (error && !client) {
    return (
      <ErrorDisplay 
        title="Error Loading Client"
        message={`Unable to load client data: ${error instanceof Error ? error.message : String(error)}`}
        details={`Client ID: ${id || 'unknown'}`}
        onRetry={refetchClient}
      />
    );
  }

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
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-12 w-1/4 bg-gray-200 rounded"></div>
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
                    submitButtonText="Update Client"
                  />
                </div>
                <div className="lg:col-span-1">
                  <ClientDetailsCard 
                    client={client} 
                    isLoading={isLoadingClient} 
                    logClientActivity={logClientActivity}
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
                  logClientActivity={logClientActivity}
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
  );
}

export default EditClientInfo;
