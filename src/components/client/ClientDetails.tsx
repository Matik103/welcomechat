
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
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
        
        // Try to send invitation if we have a new client id
        if (newClientId) {
          try {
            toast.info("Sending invitation email...");
            await sendInvitation(newClientId, data.email, data.client_name);
            toast.success("Invitation email sent to client");
          } catch (inviteError) {
            console.error("Failed to send invitation:", inviteError);
            toast.error("Client created but failed to send invitation email");
          }
        }
        
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
        onSendInvitation={handleSendInvitation}
        isSendingInvitation={isSending}
      />
    </div>
  );
};
