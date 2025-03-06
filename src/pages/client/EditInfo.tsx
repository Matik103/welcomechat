
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ErrorDisplay from "@/components/client/ErrorDisplay";
import EditInfoHeader from "@/components/client/EditInfoHeader";
import ClientInfoSection from "@/components/client/ClientInfoSection";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";

const EditInfo = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  
  // Set client ID from user metadata when available
  useEffect(() => {
    if (user?.user_metadata?.client_id) {
      console.log("Setting client ID from user metadata:", user.user_metadata.client_id);
      setClientId(user.user_metadata.client_id);
    } else {
      console.warn("No client ID found in user metadata");
      toast.error("Client ID not found. Please contact support.");
    }
  }, [user]);
  
  // Use the enhanced useClientData hook which will handle clientId resolution
  const { client, isLoadingClient, error, clientId: resolvedClientId } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);

  console.log("EditInfo: client ID from auth:", clientId);
  console.log("EditInfo: resolved client ID:", resolvedClientId);

  if (isLoadingClient && clientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && clientId) {
    return <ErrorDisplay message={error.message} />;
  }

  // If no clientId is set yet but we're not in a loading state, show a helpful message
  if (!clientId && !isLoadingClient) {
    return (
      <ErrorDisplay message="No client ID found. Please refresh the page or contact support." />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <EditInfoHeader />
      
      <div className="space-y-8">
        <ClientInfoSection 
          client={client} 
          clientId={clientId} 
          logClientActivity={logClientActivity}
          isClientView={true}
        />

        <ClientResourceSections 
          clientId={clientId} 
          isClientView={true}
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
};

export default EditInfo;
