
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { useClientFormSubmission } from "@/hooks/useClientFormSubmission";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          {isClientView ? 'Your Information' : 'Client Information'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClientForm
          initialData={client}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isClientView={isClientView}
        />
      </CardContent>
    </Card>
  );
};
