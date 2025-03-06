
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
  const clientMutation = useClientMutation(clientId);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      console.log("ClientDetails - Submitting form with data:", data);
      
      if (clientId) {
        // Update existing client
        console.log("ClientDetails - Using client ID:", clientId);
        await clientMutation.mutateAsync(data);
        
        if (isClientView) {
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
      } else {
        // Create new client
        console.log("Creating new client with data:", data);
        try {
          const newClientId = await createClient(data);
          console.log("New client created with ID:", newClientId);
          
          // Send invitation to the new client
          const { sendInvitation } = await import("@/services/clientService");
          await sendInvitation(newClientId, data.email, data.client_name);
          
          toast.success("Client created and invitation sent successfully");
        } catch (createError) {
          console.error("Error creating client:", createError);
          toast.error("Failed to create client. Please try again.");
          throw createError;
        }
      }
      
      navigate("/admin/clients");
    } catch (error) {
      console.error("Error submitting client form:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
      />
    </div>
  );
};
