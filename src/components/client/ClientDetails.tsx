
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientMutation } from "@/hooks/useClientMutation";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { createClient } from "@/services/clientService";
import { toast } from "sonner";

interface ClientDetailsProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientDetails = ({ 
  client, 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientDetailsProps) => {
  const navigate = useNavigate();
  // Only initialize clientMutation for existing clients
  const clientMutation = useClientMutation(clientId);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      console.log("ClientDetails - Submitting form with data:", data);
      
      // Handle new client creation
      if (!clientId) {
        console.log("Creating new client");
        try {
          const newClientId = await createClient(data);
          console.log("New client created with ID:", newClientId);
          toast.success("Client created successfully");
          navigate(`/admin/clients/${newClientId}`);
          return;
        } catch (error) {
          console.error("Error creating client:", error);
          toast.error(`Error creating client: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
      
      // Only get here if we have a valid clientId
      console.log("Updating existing client with ID:", clientId);
      await clientMutation.mutateAsync(data);
      
      if (clientId && isClientView) {
        try {
          // Determine which fields were actually updated
          const updatedFields = Object.keys(data).filter(key => 
            client && data[key as keyof typeof data] !== client[key as keyof typeof client]
          );
          
          console.log("Updated fields:", updatedFields);
          
          if (updatedFields.length > 0) {
            await logClientActivity(
              "client_updated", 
              "updated their client information",
              { updated_fields: updatedFields }
            );
          }
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }
      }
      
      if (!isClientView) {
        navigate("/admin/clients");
      }
    } catch (error) {
      console.error("Error submitting client form:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientId ? clientMutation.isPending : false}
        isClientView={isClientView}
      />
    </div>
  );
};
