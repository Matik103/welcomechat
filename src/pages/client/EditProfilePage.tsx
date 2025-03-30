import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useClientData } from '@/hooks/useClientData';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { ClientLayout } from '@/components/layout/ClientLayout';
import ErrorDisplay from '@/components/ErrorDisplay';
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { useClientActivity } from '@/hooks/useClientActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { checkAndRefreshAuth } from '@/services/authService';

export default function EditProfilePage() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Check auth status on component mount
    const verifyAuth = async () => {
      const isValid = await checkAndRefreshAuth();
      setAuthChecked(true);
      if (!isValid) {
        toast.error("Your session has expired. Please log in again.");
        navigation.goToAuth();
      }
    };
    
    verifyAuth();
  }, [navigation]);
  
  // Use the client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  
  useEffect(() => {
    console.log("User metadata in EditProfilePage:", user?.user_metadata);
    console.log("Client ID from metadata:", clientId);
  }, [user, clientId]);
  
  const { logClientActivity } = useClientActivity(clientId);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient
  } = useClientData(clientId);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (!clientId) {
        toast.error("Client ID not found in your user profile");
        return;
      }
      
      if (!client) {
        toast.error("Unable to load your information");
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
      
      toast.success("Your profile has been updated successfully");
      await logActivityWrapper();
      refetchClient();
    } catch (error) {
      console.error("Error updating profile information:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      toast.error(`Failed to update your profile: ${errorMessage}`);
    }
  };

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

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

  if (!authChecked) {
    return (
      <ClientLayout>
        <div className="mt-6 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Verifying your authentication...</p>
        </div>
      </ClientLayout>
    );
  }

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
          Profile Settings
          <p className="text-sm font-normal text-muted-foreground">
            Manage your profile information and resources
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
                      submitButtonText="Update Profile"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('resources')}
                  >
                    Manage Resources
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
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
