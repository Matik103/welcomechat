
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useClientActivity } from "@/hooks/useClientActivity";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientForm } from "@/components/client/ClientForm";
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/client-form';

const EditClientInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userRole } = useAuth();
  
  // Determine if we're in client view or admin view
  const isClientView = userRole === 'client';
  
  // For client view, we'll use the client ID from user metadata
  // For admin view, we'll use the ID from URL params
  const clientId = isClientView 
    ? user?.user_metadata?.client_id 
    : id;
  
  const { 
    client, 
    isLoadingClient, 
    error, 
    refetchClient, 
    clientMutation 
  } = useClientData(clientId);
  
  const { logClientActivity } = useClientActivity(clientId);

  // Show error toast if client data fails to load
  useEffect(() => {
    if (error) {
      toast.error("Failed to load client information");
    }
  }, [error]);

  const handleGoBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else {
      navigate('/admin/clients');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await clientMutation.mutateAsync(data);
      
      if (clientId) {
        await createClientActivity(
          clientId,
          'client_updated' as ActivityType,
          `Updated client information`,
          { fields_updated: Object.keys(data) }
        );
      }
      
      toast.success("Client information updated successfully");
      refetchClient();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client information");
    }
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!client && !isLoadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Information Not Found</h1>
          <p className="text-gray-600 mb-6">
            {isClientView 
              ? "Your account may not be properly configured. Please contact support."
              : "We couldn't find the client information. Please check the client ID and try again."}
          </p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <PageHeading>
              {isClientView ? 'Edit Information' : `Edit Client: ${client?.client_name}`}
            </PageHeading>
            <p className="text-muted-foreground">
              {isClientView 
                ? 'Update your information and settings'
                : 'Update client information and settings'}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {isClientView ? 'Your Information' : 'Client Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientForm
                initialData={client}
                onSubmit={handleSubmit}
                isLoading={clientMutation.isPending}
                isClientView={isClientView}
              />
            </CardContent>
          </Card>

          {clientId && (
            <ClientResourceSections 
              clientId={clientId}
              agentName={client?.agent_name || client?.name || ''}
              className="mt-6"
              isClientView={isClientView}
              logClientActivity={async (activityType, description, metadata) => {
                if (clientId) {
                  return createClientActivity(clientId, activityType as ActivityType, description, metadata || {});
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditClientInfo;
