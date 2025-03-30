
import { ClientForm } from "@/components/client/ClientForm";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { updateClient } from "@/services/clientService";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useClientData } from "@/hooks/useClientData";

const EditClientInfo = () => {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [clientData, setClientData] = useState<Client | null>(null);
  
  // Get client ID from user metadata (for client view)
  const clientId = user?.user_metadata?.client_id;
  
  // Use the useClientData hook to fetch client data
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient
  } = useClientData(clientId);

  // Set client data when data is loaded
  useEffect(() => {
    if (client) {
      setClientData(client);
      console.log("Client data loaded:", client);
    }
  }, [client]);

  useEffect(() => {
    if (error) {
      console.error("Error loading client data:", error);
      toast.error("Failed to load your profile information");
    }
  }, [error]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (updatedClient: Client) => {
      if (!clientId) return null;
      return updateClient(clientId, updatedClient);
    },
    onSuccess: () => {
      refetchClient();
      toast.success("Your information has been updated successfully");
      
      // Navigate back after successful update
      handleBack();
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.error("Failed to update your information");
    },
  });

  const handleSubmit = async (client: Client) => {
    updateClientMutation.mutate(client);
  };

  const handleBack = () => {
    navigation.goToClientDashboard();
  };

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client && !isLoadingClient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
        <p className="text-muted-foreground mb-6">
          Your profile information could not be found.
        </p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-6 flex items-center gap-1"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">
        Edit Your Profile
      </h1>
      
      {clientData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClientForm
              initialData={clientData}
              onSubmit={handleSubmit}
              isLoading={updateClientMutation.isPending || isLoadingClient}
              isClientView={true}
              submitButtonText="Save Changes"
            />
          </div>
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Profile Information</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client Name</p>
                <p className="font-medium">{clientData.client_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{clientData.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">AI Agent Name</p>
                <p className="font-medium">{clientData.agent_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created On</p>
                <p className="font-medium">
                  {new Date(clientData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditClientInfo;
