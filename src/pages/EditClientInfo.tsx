
import React, { useEffect, useState } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { ClientFormData } from '@/types/client-form';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { ClientEditHeader } from '@/components/client/edit/ClientEditHeader';
import { ClientEditSkeleton } from '@/components/client/edit/ClientEditSkeleton';
import { ClientEditError } from '@/components/client/edit/ClientEditError';
import { ClientProfileLayout } from '@/components/client/edit/ClientProfileLayout';
import { ClientResourceTabs } from '@/components/client/edit/ClientResourceTabs';

export function EditClientInfo() {
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
      <ClientEditError
        title="Supabase Service Role Key Missing"
        message="The Supabase service role key is missing or invalid. Logo upload functionality requires this key."
        details="To fix this issue, add your Supabase service role key to the .env file as VITE_SUPABASE_SERVICE_ROLE_KEY. This key is required for logo uploads and storage bucket management."
        onRetry={handleRetryServiceKey}
      />
    );
  }

  if (error && !client) {
    return (
      <ClientEditError
        title="Error Loading Client"
        message={`Unable to load client data: ${error instanceof Error ? error.message : String(error)}`}
        details={`Client ID: ${clientId || 'unknown'}`}
        onRetry={refetchClient}
      />
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ClientEditHeader
        title="Edit Client Information"
        subtitle="Update client details and manage resources"
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
