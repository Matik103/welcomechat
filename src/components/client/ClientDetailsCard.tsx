
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { ClientFormData } from "@/types/client-form";
import { useClientFormSubmission } from "@/hooks/useClientFormSubmission";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { Json } from "@/integrations/supabase/types";
import { ActivityType } from "@/types/client-form";

interface ClientDetailsCardProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity?: (activity_type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
}

export const ClientDetailsCard = ({ 
  client, 
  clientId, 
  isClientView,
  logClientActivity
}: ClientDetailsCardProps) => {
  const { handleSubmit, isSubmitting, error } = useClientFormSubmission(clientId || "");

  // Log client data for debugging
  useEffect(() => {
    console.log("ClientDetailsCard received client data:", client);
  }, [client]);

  if (!client) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {isClientView ? 'Your Information' : 'Client Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Loading client information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      await handleSubmit(data);
      // If logClientActivity is provided, log the activity
      if (logClientActivity) {
        await logClientActivity(
          'client_updated',
          `Updated client information: ${client.client_name}`,
          { fields_updated: Object.keys(data) }
        );
      }
      return client; // Return client for backward compatibility
    } catch (error) {
      console.error("Error in ClientDetailsCard.handleFormSubmit:", error);
      throw error;
    }
  };

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
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          isClientView={isClientView}
        />
      </CardContent>
    </Card>
  );
};
