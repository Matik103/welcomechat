
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      console.log("Client details handleSubmit called with data:", data);
      
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
        console.log("Updating existing client with ID:", clientId);
        await clientMutation.mutateAsync(data);
        toast.success("Client information updated successfully");
        navigate("/admin/clients");
      } else {
        // Create new client
        console.log("Creating new client with data:", data);
        const newClientId = await clientMutation.mutateAsync(data);
        console.log("Client created with ID:", newClientId);
        
        // Try to send invitation if we have a new client id
        if (newClientId) {
          try {
            toast.info("Sending invitation email...");
            await sendInvitation(newClientId, data.email, data.client_name);
            toast.success("Invitation email sent to client");
          } catch (inviteError) {
            console.error("Failed to send invitation:", inviteError);
            
            // Fallback to Supabase's built-in email confirmation
            try {
              const { error: confirmError } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                  data: {
                    client_id: newClientId,
                    client_name: data.client_name,
                  },
                  emailRedirectTo: `https://admin.welcome.chat/client/setup?id=${newClientId}`
                }
              });
              
              if (confirmError) {
                throw confirmError;
              }
              
              toast.success("Confirmation email sent to client");
            } catch (confirmError) {
              console.error("Failed to send confirmation email:", confirmError);
              toast.error("Client created but failed to send email invitation. Please try again later.");
            }
          }
        }
        
        toast.success("Client created successfully");
        // Use the specific route to avoid 404 errors
        navigate("/admin/clients");
      }
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      toast.error(`Failed to save client information: ${error.message || String(error)}`);
    }
  };

  const handleSendInvitation = async () => {
    if (!client || !clientId) {
      toast.error("Cannot send invitation: missing client information");
      return;
    }

    try {
      await sendInvitation(clientId, client.email, client.client_name);
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      
      // Fallback to Supabase's built-in email confirmation
      try {
        const { error: confirmError } = await supabase.auth.signInWithOtp({
          email: client.email,
          options: {
            data: {
              client_id: clientId,
              client_name: client.client_name,
            },
            emailRedirectTo: `https://admin.welcome.chat/client/setup?id=${clientId}`
          }
        });
        
        if (confirmError) {
          throw confirmError;
        }
        
        toast.success("Confirmation email sent to client");
      } catch (confirmError) {
        console.error("Failed to send confirmation email:", confirmError);
        toast.error(`Failed to send invitation: ${error.message || String(error)}`);
      }
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
