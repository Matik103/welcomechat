
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useClient } from "@/hooks/useClient";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useClientActivity } from "@/hooks/useClientActivity";
import { toast } from 'sonner';

const ResourceSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  
  const { client, isLoadingClient, error } = useClient(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  useEffect(() => {
    if (error) {
      toast.error("Failed to load your data");
      console.error("Error loading client data:", error);
    }
  }, [error]);

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
          <p className="text-gray-600 mb-6">We couldn't find your client information. Please contact support if this issue persists.</p>
          <Link to="/client/dashboard" className="text-blue-500 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/client/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resources & Knowledge</h1>
            <p className="text-gray-500">Manage the knowledge sources for your AI assistant</p>
          </div>
        </div>

        <ClientResourceSections 
          clientId={clientId}
          agentName={client?.agent_name || client?.name}
          className="mt-6"
          isClientView={true}
        />
      </div>
    </div>
  );
};

export default ResourceSettings;
