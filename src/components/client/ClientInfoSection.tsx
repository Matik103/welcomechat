
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { ClientDetails } from "@/components/client/ClientDetails";
import { Client } from "@/types/client";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

interface ClientInfoSectionProps {
  client: Client | null;
  clientId: string | undefined;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

const ClientInfoSection = ({ 
  client, 
  clientId, 
  logClientActivity 
}: ClientInfoSectionProps) => {
  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center gap-2">
        <User className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent>
        <ClientDetails 
          client={client} 
          clientId={clientId} 
          isClientView={true}
          logClientActivity={logClientActivity}
        />
      </CardContent>
    </Card>
  );
};

export default ClientInfoSection;
