
import { Client } from "@/types/client";
import { ClientDetailsCard } from "./ClientDetailsCard";

interface ClientDetailsProps {
  client: Client | null;
  clientId?: string;
  isClientView: boolean;
  logClientActivity: () => Promise<void>;
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
