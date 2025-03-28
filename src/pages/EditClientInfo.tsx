
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

export function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(id);

  useEffect(() => {
    // Clear any previous errors when component mounts or client changes
    setUpdateError(null);
  }, [client, id]);

  const handleSubmit = async (data: ClientFormData) => {
    if (!clientId) {
      toast.error("Client ID is missing. Cannot update client.");
      return;
    }
    
    try {
      setFormSubmitting(true);
      setUpdateError(null);
      
      console.log("Submitting client update for ID:", clientId);
      console.log("Form data:", JSON.stringify(data));
      
      await clientMutation.mutateAsync({
        client_id: clientId,
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        agent_description: data.agent_description || '',
        logo_url: data.logo_url || '',
        logo_storage_path: data.logo_storage_path || ''
      });
      
      // We don't need to toast success here as it's handled in the mutation
      await refetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      setUpdateError(error instanceof Error ? error.message : "Failed to update client information");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Function to log client activity
  const logClientActivity = async () => {
    try {
      // In a real implementation, we would log client activity
      // This is a placeholder for now
      console.log("Logging client activity for client:", clientId);
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging client activity:", error);
      return Promise.reject(error);
    }
  };

  // Check if Supabase service role key is configured
  const isServiceRoleConfigured = isAdminClientConfigured();
  if (!isServiceRoleConfigured) {
    return (
      <ErrorDisplay 
        title="Supabase Service Role Key Missing"
        message="The Supabase service role key is missing or invalid. Logo upload functionality requires this key."
        details="This key is required for logo uploads and storage bucket management."
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
              isLoading={isLoadingClient || formSubmitting}
              error={updateError || (error ? (error instanceof Error ? error.message : String(error)) : null)}
              submitButtonText="Update Client"
            />
            
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
    </div>
  );
}

export default EditClientInfo;
