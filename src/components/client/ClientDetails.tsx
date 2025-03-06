
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
  // In creation mode, we don't have a clientId yet
  const isCreationMode = !clientId;
  // Use the clientId that was passed to the component
  const { clientMutation } = useClientData(clientId);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      // Don't require clientId when creating a new client
      if (!isCreationMode && !clientId) {
        toast.error("Client ID is required to save changes");
        return;
      }
      
      await clientMutation.mutateAsync(data);
      
      // Log client information update activity - only for existing clients
      if (clientId && isClientView) {
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
      }
      
      toast.success(isCreationMode ? "Client created successfully" : "Client information saved successfully");
      
      // Only navigate away if not in client view
      if (!isClientView) {
        navigate("/admin/clients");
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
