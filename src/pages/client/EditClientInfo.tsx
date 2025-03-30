
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useClientData } from '@/hooks/useClientData';
import { useNavigation } from '@/hooks/useNavigation';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useClientActivity } from '@/hooks/useClientActivity';

export default function EditClientInfo() {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // Get client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);

  const { 
    client, 
    isLoadingClient,
    error,
    refetchClient
  } = useClientData(clientId);

  // For debugging - log what we have
  useEffect(() => {
    console.log("User metadata:", user?.user_metadata);
    console.log("Client ID from metadata:", clientId);
    console.log("Current client state:", { client, isLoadingClient, error });
  }, [user, clientId, client, isLoadingClient, error]);

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
        Manage Your Resources
        <p className="text-sm font-normal text-muted-foreground">
          Add websites, documents, and other resources for your AI assistant
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
          {clientId && (
            <ClientResourceSections 
              clientId={clientId}
              logClientActivity={logActivityWrapper}
              onResourceChange={refetchClient}
            />
          )}
        </div>
      )}
    </div>
  );
}
