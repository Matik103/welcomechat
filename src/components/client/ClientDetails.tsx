
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
  const { clientMutation, refetchClient } = useClientData(clientId);

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
        navigate("/admin/clients");
      } else {
        // Create new client - show loading toast
        const toastId = "client-creation";
        toast.loading("Creating client account...", { id: toastId });
        
        try {
          // Create the client and attempt to send invitation
          const result = await clientMutation.mutateAsync(data);
          
          // Check if result contains emailSent flag
          if (typeof result === 'object' && 'clientId' in result) {
            if (result.emailSent) {
              toast.dismiss(toastId);
              toast.success("Client created and invitation email sent successfully");
            } else {
              toast.dismiss(toastId);
              // Show a more detailed error message if we have one
              const errorDetail = result.emailError ? `: ${result.emailError}` : "";
              toast.warning(`Client created but failed to send invitation email${errorDetail}. Please try sending it manually later.`);
            }
            
            // Navigate back to client list regardless of email status
            navigate("/admin/clients");
          } else {
            // Handle legacy return format (just clientId)
            toast.dismiss(toastId);
            toast.success("Client created successfully");
            navigate("/admin/clients");
          }
        } catch (createError) {
          toast.dismiss(toastId);
          console.error("Error creating client:", createError);
          toast.error("Failed to create client. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting client form:", error);
      toast.error("Failed to save client information");
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
