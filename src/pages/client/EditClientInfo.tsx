
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ClientForm } from "@/components/client/ClientForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";

const EditClientInfo = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const navigate = useNavigate();
  
  const { client, isLoadingClient, error, clientMutation } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  const handleSubmit = async (data) => {
    try {
      await clientMutation.mutateAsync(data);
      // After successful update, log the activity
      await logClientActivity("client_updated", "Updated client information");
      toast.success("Your information has been updated");
    } catch (error) {
      toast.error(`Failed to update your information: ${error.message}`);
    }
  };
  
  const handleBack = () => {
    navigate("/client/dashboard");
  };
  
  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          <p className="text-red-500">Error loading your information: {error.message}</p>
          <Button 
            onClick={handleBack}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Your Information</h1>
            <p className="text-gray-500">Update your client information</p>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Pass the client data to the ClientForm component */}
          {client && (
            <ClientForm 
              initialData={client}
              isLoading={clientMutation.isPending}
              onSubmit={handleSubmit}
              isClientView={true}
            />
          )}
          
          {/* Only show resource sections if we have a clientId */}
          {clientId && (
            <ClientResourceSections 
              clientId={clientId} 
              isClientView={true}
              logClientActivity={logClientActivity}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditClientInfo;
