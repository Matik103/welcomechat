
import React, { useEffect, useState } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { isAdminClientConfigured } from '@/integrations/supabase/admin';
import { ClientEditHeader } from '@/components/client/edit/ClientEditHeader';
import { ClientEditSkeleton } from '@/components/client/edit/ClientEditSkeleton';
import { ClientEditError } from '@/components/client/edit/ClientEditError';
import { ClientProfileLayout } from '@/components/client/edit/ClientProfileLayout';
import { ClientResourceTabs } from '@/components/client/edit/ClientResourceTabs';
import { ActivityType } from '@/types/activity';

export function EditClientInfo() {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [serviceKeyError, setServiceKeyError] = useState<boolean>(!isAdminClientConfigured());
  
  // Get client data from user metadata
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(undefined); // Will use client ID from user metadata

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
      
      toast.success("Your information has been updated successfully");
      refetchClient();
      
      // Log the activity
      logClientActivity(ActivityType.PROFILE_UPDATED, "Client profile updated");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(`Failed to update information: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleNavigateBack = () => {
    navigation.goToClientDashboard();
  };

  const handleRetryServiceKey = () => {
    setServiceKeyError(!isAdminClientConfigured());
  };

  const logClientActivity = async (type: ActivityType, description: string, metadata?: Record<string, any>) => {
    try {
      console.log("Logging client activity:", type, description, client?.id || clientId);
      // Here you would implement actual logging logic - for now we just log to console
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging client activity:", error);
      return Promise.reject(error);
    }
  };

  if (serviceKeyError) {
    return (
      <ClientEditError
        title="Service Configuration Issue"
        message="The application service configuration is incomplete. Please contact support."
        details="Storage functionality for logo uploads requires proper configuration."
        onRetry={handleRetryServiceKey}
      />
    );
  }

  if (error && !client) {
    return (
      <ClientEditError
        title="Error Loading Your Information"
        message={`Unable to load your profile data: ${error instanceof Error ? error.message : String(error)}`}
        details={`Please try again later or contact support if the problem persists.`}
        onRetry={refetchClient}
      />
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ClientEditHeader
        title="Your Profile Information"
        subtitle="Update your details and manage resources"
        onBack={handleNavigateBack}
      />

      {isLoadingClient ? (
        <ClientEditSkeleton />
      ) : (
        <div className="mt-6">
          <ClientResourceTabs
            client={client}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            refetchClient={refetchClient}
            logClientActivity={logClientActivity}
          />
          
          {activeTab === 'profile' && client && (
            <ClientProfileLayout
              client={client}
              isLoading={isLoadingClient || clientMutation.isPending}
              error={error ? (error instanceof Error ? error.message : String(error)) : null}
              onSubmit={handleSubmit}
              logClientActivity={logClientActivity}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default EditClientInfo;
