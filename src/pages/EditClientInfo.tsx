
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { ClientDetails } from "@/components/client/ClientDetails";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useClientActivity } from "@/hooks/useClientActivity";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/dashboard/PageHeading';

const EditClientInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userRole } = useAuth();
  
  // Determine if we're in client view or admin view
  const isClientView = userRole === 'client';
  
  console.log("EditClientInfo - id param:", id);
  console.log("EditClientInfo - userRole:", userRole);
  console.log("EditClientInfo - isClientView:", isClientView);
  
  // For client view, use user metadata clientId, for admin view use the id param
  const clientId = isClientView ? user?.user_metadata?.client_id : id;
  
  const { client, isLoadingClient, error, refetchClient } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  useEffect(() => {
    if (error) {
      toast.error("Failed to load agent data");
      console.error("Error loading agent data:", error);
    }
  }, [error]);

  // Debug logging
  useEffect(() => {
    console.log("EditClientInfo - client data:", client);
  }, [client]);

  const handleGoBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else {
      navigate('/admin/clients');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Information Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the agent information. Please check the agent ID and try again.</p>
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
              {isClientView ? 'Edit Information' : `Edit Agent: ${client?.client_name}`}
            </PageHeading>
            <p className="text-muted-foreground">
              {isClientView 
                ? 'Update your information and settings'
                : 'Update agent information and settings'}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <ClientDetails 
            client={client}
            clientId={clientId || ''}
            isClientView={isClientView}
            logClientActivity={logClientActivity}
          />

          <ClientResourceSections 
            clientId={clientId || ''}
            agentName={client?.agent_name || client?.name || ''}
            className="mt-6"
            isClientView={isClientView}
            logClientActivity={logClientActivity}
          />
        </div>
      </div>
    </div>
  );
};

export default EditClientInfo;
