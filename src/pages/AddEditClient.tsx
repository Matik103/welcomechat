
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";
import { useAuth } from "@/contexts/AuthContext";
import { ClientDetails } from "@/components/client/ClientDetails";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useClientActivity } from "@/hooks/useClientActivity";
import { toast } from "sonner";

interface AddEditClientProps {
  isClientView?: boolean;
}

const AddEditClient = ({ isClientView = false }: AddEditClientProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Only use the paramClientId if we're editing an existing client or in client view
  const paramClientId = id || (isClientView ? user?.user_metadata?.client_id : undefined);
  
  // Use the enhanced useClientData hook which will handle clientId resolution
  const { client, isLoadingClient, error, clientMutation, clientId } = useClientData(paramClientId);
  const { logClientActivity } = useClientActivity(clientId);

  if (error) {
    toast.error("Failed to load client data");
    console.error("Error loading client data:", error);
  }

  const handleBack = () => {
    if (isClientView) {
      navigate("/client/view");
    } else {
      navigate("/admin/clients");
    }
  };

  if (isLoadingClient && id) {
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
              {isClientView 
                ? "Edit Client Information" 
                : id 
                  ? `Edit Client - ${client?.client_name}` 
                  : "Add New Client"}
            </h1>
            <p className="text-gray-500">
              {isClientView 
                ? "Update your client information" 
                : id 
                  ? "Update client information" 
                  : "Create a new client"}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <ClientDetails 
            client={client}
            clientId={clientId}
            isClientView={isClientView}
            logClientActivity={logClientActivity}
          />

          {/* Only show resource sections if we have a clientId */}
          {clientId && (
            <ClientResourceSections 
              clientId={clientId} 
              isClientView={isClientView}
              logClientActivity={logClientActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEditClient;
