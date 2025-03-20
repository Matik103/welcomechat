
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { useClientFormSubmission } from "@/hooks/useClientFormSubmission";

interface ClientDetailsCardProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const ClientDetailsCard = ({ 
  client, 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientDetailsCardProps) => {
  const { handleSubmit, isLoading } = useClientFormSubmission(clientId, isClientView, logClientActivity);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isClientView={isClientView}
      />
    </div>
  );
};
