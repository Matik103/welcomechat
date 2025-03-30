
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useClientData } from "@/hooks/useClientData";
import { ClientProfileSection } from "@/components/client/settings/ClientProfileSection";
import { Client } from "@/types/client";

const EditClientInfo = () => {
  const navigation = useNavigation();
  const [clientData, setClientData] = useState<Client | null>(null);
  
  // Use the useClientData hook without passing an ID - it will use the client ID from user metadata
  const { 
    client, 
    isLoadingClient,
    error,
    clientMutation,
    refetchClient
  } = useClientData(undefined);

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
    }
  }, [error]);

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
        <ClientProfileSection 
          client={clientData} 
          clientMutation={clientMutation} 
          refetchClient={refetchClient}
        />
      )}
    </div>
  );
};

export default EditClientInfo;
