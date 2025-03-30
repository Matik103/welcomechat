
import React, { useEffect, useState } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { ClientLayout } from '@/components/layout/ClientLayout';
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
import ErrorDisplay from '@/components/ErrorDisplay';
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';

export function EditClientInfo() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient,
    isServiceKeyConfigured
  } = useClientData(undefined); // For client users, this will use their metadata client_id

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
      
      // Use the correct client_id for the update
      // First check if client.id exists, then fall back to client.client_id, then the clientId from the hook
      const updateClientId = client.id || client.client_id || clientId;
      
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

  const logClientActivity = async () => {
    try {
      console.log("Logging client activity for client:", client?.id || clientId);
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging client activity:", error);
      return Promise.reject(error);
    }
  };

  if (!isServiceKeyConfigured) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8">
          <ErrorDisplay 
            title="Supabase Service Role Key Missing"
            message="The Supabase service role key is missing or invalid. This key is required for profile management and file uploads."
            details="The key is detected from the hardcoded values in the application. If this issue persists, please contact the development team."
            onRetry={() => window.location.reload()}
          />
        </div>
      </ClientLayout>
    );
  }

  if (error && !client) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8">
          <ErrorDisplay 
            title="Error Loading Client"
            message={`Unable to load client data: ${error instanceof Error ? error.message : String(error)}`}
            details={`Client ID: ${clientId || 'unknown'}`}
            onRetry={refetchClient}
          />
        </div>
      </ClientLayout>
    );
  }

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
          Back
        </Button>
        
        <PageHeading>
          Edit Profile Information
          <p className="text-sm font-normal text-muted-foreground">
            Update your details and manage resources
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
                      submitButtonText="Update Profile"
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
    </ClientLayout>
  );
}

export default EditClientInfo;
