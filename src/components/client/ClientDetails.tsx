
import { Client } from "@/types/client";
import { ActivityType } from "@/types/client-form";
import { Json } from "@/integrations/supabase/types";
import { ClientDetailsCard } from "./ClientDetailsCard";

interface ClientDetailsProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
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
