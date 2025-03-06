
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { ClientDetails } from "@/components/client/ClientDetails";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ProfileSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // After initial load, set the flag to false
    if (!isLoadingClient && isInitialLoad) {
      setIsInitialLoad(false);
    }
    
    // Handle error scenario
    if (error && !isLoadingClient) {
      console.error("Error loading client data:", error);
      toast.error("Failed to load client information");
    }
  }, [isLoadingClient, error, isInitialLoad]);

  if (isInitialLoad && isLoadingClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading client information...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Update your client information and resources</p>
        </div>

        {client && (
          <>
            <ClientDetails 
              client={client} 
              clientId={clientId} 
              isClientView={true} 
              logClientActivity={logClientActivity}
            />
            
            <ClientResourceSections 
              clientId={clientId} 
              isClientView={true}
              logClientActivity={logClientActivity}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
