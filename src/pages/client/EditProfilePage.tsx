
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
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { useClientActivity } from '@/hooks/useClientActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditProfilePage() {
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

  // Add an effect to show a toast if no clientId is found
  useEffect(() => {
    if (user && !clientId && !isLoadingClient) {
      toast.error("No client ID found in your user profile. Please contact support.");
    }
  }, [user, clientId, isLoadingClient]);

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

  // No ClientId scenario
  if (!clientId && !isLoadingClient) {
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
          
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Error</AlertTitle>
            <AlertDescription>
              Your user profile does not have a client ID associated with it. Please contact support for assistance.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Button onClick={handleNavigateBack}>Return to Dashboard</Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  // Loading state
  if (isLoadingClient) {
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
          
          <div className="mt-6 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading your information...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  // Show simple message if client data couldn't be loaded instead of error
  if (error || !client) {
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
          
          <div className="mt-6 p-8 bg-amber-50 border border-amber-200 rounded-md text-center">
            <h3 className="text-lg font-medium text-amber-800 mb-2">Information Not Available</h3>
            <p className="text-amber-700 mb-4">Your profile information could not be loaded at this time.</p>
            <Button 
              onClick={refetchClient} 
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  // Main content - only shown when we have client data
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
              <ClientResourceSections 
                clientId={client.id || client.client_id}
                logClientActivity={logActivityWrapper}
                onResourceChange={refetchClient}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ClientLayout>
  );
}
