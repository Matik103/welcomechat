
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
        // Create new client
        toast.loading("Creating client and sending invitation...", { duration: 10000 });
        
        try {
          await clientMutation.mutateAsync(data);
          toast.dismiss();
          toast.success("Client created and invitation sent successfully");
          navigate("/admin/clients");
        } catch (createError) {
          toast.dismiss();
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
