
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useNavigate } from "react-router-dom";
import { ClientDetails } from "@/components/client/ClientDetails";
import { useClientActivity } from "@/hooks/useClientActivity";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get client ID from user metadata
  const clientId = user?.user_metadata?.client_id;
  
  // Use hooks to fetch client data and handle activity logging
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load client data");
      console.error("Error loading client data:", error);
    }
  }, [error]);

  const handleBack = () => {
    navigate("/client/view");
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-500">
              Update your client information and resources
            </p>
          </div>
        </div>

        <ClientDetails 
          client={client}
          clientId={clientId}
          isClientView={true}
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
};

export default ProfileSettings;
