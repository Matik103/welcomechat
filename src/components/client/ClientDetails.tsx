
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

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
  const { clientMutation } = useClientData(clientId);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    try {
      await clientMutation.mutateAsync(data);
      
      // Log client information update activity
      if (clientId && isClientView) {
        await logClientActivity(
          "client_updated", 
          "updated their client information",
          { 
            updated_fields: Object.keys(data).filter(key => 
              client && data[key as keyof typeof data] !== client[key as keyof typeof client]
            )
          }
        );
      }
      
      if (isClientView) {
        navigate("/client/view");
      } else {
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
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
      />
    </div>
  );
};
