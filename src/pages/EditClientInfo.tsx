
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
  const [hasErrored, setHasErrored] = useState(false);
  
  console.log("Edit Client Info - ID from params:", id);
  
  // Determine if we're in client view or admin view
  const isClientView = userRole === 'client';
  
  // For client view, use user metadata clientId, for admin view use the id param
  const clientId = isClientView ? user?.user_metadata?.client_id : id;
  
  console.log("Edit Client Info - Using client ID:", clientId);
  
  const { client, isLoadingClient, error, refetchClient } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  useEffect(() => {
    if (error) {
      console.error("Error loading client data:", error);
      toast.error("Failed to load client data");
      setHasErrored(true);
    }
  }, [error]);

  useEffect(() => {
    // If we have a client, clear the error state
    if (client) {
      setHasErrored(false);
      
      // Log found logo info
      if (client.logo_url) {
        console.log("EditClientInfo: Found logo URL:", client.logo_url);
      } else {
        console.log("EditClientInfo: No logo URL found in client data");
      }
    }
  }, [client]);

  const handleGoBack = () => {
    if (isClientView) {
      navigate('/client/dashboard');
    } else {
      navigate(`/admin/clients`);
    }
  };

  const handleRetry = () => {
    setHasErrored(false);
    refetchClient();
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading client information...</p>
        </div>
      </div>
    );
  }

  if (((!client && !isLoadingClient) || hasErrored) && clientId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Information Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the client information. Please check the client ID and try again.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={handleRetry} variant="default">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retry
            </Button>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-md text-left">
              <h3 className="text-sm font-medium text-red-800">Error details:</h3>
              <pre className="mt-2 text-xs text-red-800 overflow-auto max-h-40">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
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
