
import { Client } from "@/types/client";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { ClientDetailsCard } from "./ClientDetailsCard";

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
  return (
    <ClientDetailsCard
      client={client}
      clientId={clientId}
      isClientView={isClientView}
      logClientActivity={logClientActivity}
    />
  );
};
