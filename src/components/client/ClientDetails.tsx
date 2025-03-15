
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { createClientUserAccount, sendClientInvitation } from "@/services/clientService";

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
  // Use the clientId that was passed to the component
  const { clientMutation, sendInvitation, isSending, refetchClient } = useClientData(clientId);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      if (clientId && isClientView) {
        // Update existing client
        await clientMutation.mutateAsync(data);
        
        // Refetch client data to update the UI with the latest changes
        refetchClient();
        
        // Log client information update activity
        try {
          await logClientActivity(
            "client_updated", 
            "updated their client information",
            { 
              updated_fields: Object.keys(data).filter(key => 
                client && data[key as keyof typeof data] !== client[key as keyof typeof client]
              )
            }
          );
        } catch (logError) {
          console.error("Error logging activity:", logError);
          // Continue even if logging fails
        }
        
        toast.success("Client information saved successfully");
      } else if (clientId) {
        // Admin updating client
        await clientMutation.mutateAsync(data);
        toast.success("Client information updated successfully");
        navigate("/admin/clients");
      } else {
        // Create new client
        const newClientId = await clientMutation.mutateAsync(data);
        toast.success("Client created successfully");
        navigate("/admin/clients");
      }
    } catch (error) {
      console.error("Error submitting client form:", error);
      toast.error("Failed to save client information");
    }
  };

  const handleSendInvitation = async () => {
    if (!client || !clientId) {
      toast.error("Cannot send invitation: missing client information");
      return;
    }

    try {
      await sendInvitation(clientId, client.email, client.client_name);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  const handleCreateClientAccount = async () => {
    if (!client || !clientId) {
      toast.error("Cannot create account: missing client information");
      return;
    }

    try {
      toast.info("Creating client user account with temporary password...");
      await createClientUserAccount(clientId, client.email, client.client_name, client.agent_name);
      toast.success("Client account created successfully");
    } catch (error) {
      console.error("Error creating client account:", error);
      toast.error("Failed to create client account: " + error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
        onSendInvitation={handleSendInvitation}
        onCreateClientAccount={handleCreateClientAccount}
        isSendingInvitation={isSending}
      />
    </div>
  );
};
