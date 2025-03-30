
import { ClientForm } from "@/components/client/ClientForm";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { updateClient } from "@/services/clientService";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useClient } from "@/hooks/useClient";

const EditClientInfo = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [clientData, setClientData] = useState<Client | null>(null);
  
  // Get client ID - either from URL param (admin view) or user metadata (client view)
  const clientId = isAdmin ? id : user?.user_metadata?.client_id;
  
  // Use activity logging hook
  const { logClientActivity } = useClientActivity(clientId);
  
  // Use the useClient hook instead of a direct query
  const { data, isLoading, refetch } = useClient(clientId || '', {
    enabled: !!clientId,
  });

  // Set client data when data is loaded
  useEffect(() => {
    if (data) {
      setClientData(data);
      
      // Log that client was viewed/accessed (only in admin view)
      if (isAdmin && clientId) {
        logClientActivity(
          "client_updated",
          `Client ${data.client_name} accessed for editing`,
          {
            client_id: clientId,
            client_name: data.client_name,
            viewed_by: user?.email
          }
        );
      }
    }
  }, [data, isAdmin, clientId, user?.email, logClientActivity]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (updatedClient: Client) => {
      if (!clientId) return null;
      return updateClient(clientId, updatedClient);
    },
    onSuccess: () => {
      refetch();
      toast.success("Client information updated successfully");
      
      // Log client update activity
      if (clientId && clientData) {
        logClientActivity(
          "client_updated",
          `Client ${clientData.client_name} information updated`,
          {
            client_id: clientId,
            client_name: clientData.client_name,
            updated_by: user?.email
          }
        );
      }
      
      // Navigate back after successful update
      handleBack();
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.error("Failed to update client information");
    },
  });

  const handleSubmit = async (client: Client) => {
    updateClientMutation.mutate(client);
  };

  const handleBack = () => {
    if (isAdmin) {
      navigate(`/admin/clients/view/${clientId}`);
    } else {
      navigation.goToClientDashboard();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The client you're looking for could not be found.
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
        {isAdmin ? 'Edit Client Information' : 'Edit Your Information'}
      </h1>
      
      {clientData && (
        <ClientForm
          initialData={clientData}
          onSubmit={handleSubmit}
          isLoading={updateClientMutation.isPending}
          isClientView={!isAdmin}
        />
      )}
    </div>
  );
};

export default EditClientInfo;
