
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useClientData } from '@/hooks/useClientData';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorDisplay from '@/components/ErrorDisplay';
import { ClientProfileSection } from '@/components/client/settings/ClientProfileSection';
import { ClientDetailsCard } from '@/components/client/ClientDetailsCard';
import { useClientActivity } from '@/hooks/useClientActivity';
import { toast } from 'sonner';
import { ActivityType } from '@/types/activity';

export default function EditClientInfo() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Get client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  
  // Initialize client activity logging
  const { logClientActivity } = useClientActivity(clientId);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient,
    adminClientConfigured
  } = useClientData(clientId);

  // Force a refetch if client is null but we have a clientId
  useEffect(() => {
    if (!client && !isLoadingClient && clientId && !error) {
      console.log("No client data but have clientId, forcing refetch for:", clientId);
      refetchClient();
    }
  }, [client, isLoadingClient, clientId, error, refetchClient]);

  // Log view activity when component mounts
  useEffect(() => {
    if (clientId && client) {
      const logActivity = async () => {
        try {
          await logClientActivity(ActivityType.CLIENT_VIEWED, 'Client viewed their profile settings');
        } catch (error) {
          console.error("Error logging client activity:", error);
        }
      };
      logActivity();
    }
  }, [clientId, client, logClientActivity]);

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

  // Show error if admin client is not configured
  if (!adminClientConfigured) {
    return (
      <div className="container mx-auto py-8">
        <ErrorDisplay 
          title="Service Configuration Error"
          message="The application service role key is not properly configured."
          details="This issue needs to be fixed by an administrator. Please contact support."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Show error if client data failed to load
  if (error && !isLoadingClient) {
    return (
      <div className="container mx-auto py-8">
        <ErrorDisplay 
          title="Error Loading Your Information"
          message={`Unable to load your information: ${error instanceof Error ? error.message : String(error)}`}
          details={`Client ID: ${clientId || 'unknown'}`}
          onRetry={refetchClient}
        />
      </div>
    );
  }

  const handleLogClientActivity = async (type: ActivityType, description: string, metadata?: Record<string, any>) => {
    if (!clientId) return Promise.resolve();
    try {
      await logClientActivity(type, description, metadata);
      console.log("Client activity logged for client:", client?.id || clientId);
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
        Back to Dashboard
      </Button>
      
      <PageHeading>
        Profile Settings
        <p className="text-sm font-normal text-muted-foreground">
          Update your information and manage resources
        </p>
      </PageHeading>

      {isLoadingClient ? (
        <div className="mt-6 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your information...</p>
        </div>
      ) : client ? (
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ClientProfileSection 
                    client={client}
                    clientMutation={clientMutation}
                    refetchClient={refetchClient}
                  />
                </div>
                <div className="lg:col-span-1">
                  <ClientDetailsCard 
                    client={client} 
                    isLoading={isLoadingClient} 
                    isClientView={true}
                    logClientActivity={() => handleLogClientActivity(ActivityType.CLIENT_VIEWED, 'Client viewed their details')}
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
                  clientId={clientId || ''}
                  logClientActivity={handleLogClientActivity}
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
      ) : (
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
      )}
    </div>
  );
}
