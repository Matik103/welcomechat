
import { Client } from "@/types/client";
import { ActivityType } from "@/types/client-form";
import { ClientDetailsCard } from "./ClientDetailsCard";

interface ClientDetailsProps {
  client: Client | null;
  clientId?: string;
  isClientView: boolean;
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientDetails = ({ 
  client, 
  isClientView,
  logClientActivity 
}: ClientDetailsProps) => {
  return (
    <ClientDetailsCard
      client={client}
      isClientView={isClientView}
      logClientActivity={logClientActivity}
    />
  );
};
