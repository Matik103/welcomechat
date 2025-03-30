
import { Client } from "@/types/client";
import { ClientDetailsCard } from "./ClientDetailsCard";
import { ActivityType, ActivityTypeString } from '@/types/activity';

interface ClientDetailsProps {
  client: Client | null;
  clientId?: string;
  isClientView: boolean;
  logClientActivity: (type: ActivityType | ActivityTypeString, description: string, metadata?: Record<string, any>) => Promise<void>;
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
