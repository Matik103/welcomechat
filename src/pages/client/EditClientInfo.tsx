
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
  const [activeTab, setActiveTab] = React.useState('profile');
  const { logClientActivity } = useClientActivity(user?.user_metadata?.client_id);

  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    clientId,
    refetchClient
  } = useClientData(user?.user_metadata?.client_id);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to update client");
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

  if (error && !client) {
    return (
      <ClientLayout>
        <ErrorDisplay 
          title="Error Loading Client"
          message={`Unable to load client data: ${error instanceof Error ? error.message : String(error)}`}
          details={`Client ID: ${clientId || 'unknown'}`}
          onRetry={refetchClient}
        />
      </ClientLayout>
    );
  }

  // Type-safe logClientActivity with client name
  const logActivityWrapper = async (): Promise<void> => {
    const clientName = client?.client_name || client?.agent_name || "Unknown";
    await logClientActivity("client_updated", 
      `Client information updated for "${clientName}"`, 
      {
        client_name: clientName,
        agent_name: client?.agent_name
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
          Edit Client Information
          <p className="text-sm font-normal text-muted-foreground">
            Update your details and manage resources
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
                    submitButtonText="Update Information"
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
      </div>
    </ClientLayout>
  );
}
