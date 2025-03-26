
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { ClientFormData } from "@/types/client-form";
import { useClientFormSubmission } from "@/hooks/useClientFormSubmission";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";

interface ClientDetailsCardProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
}

export const ClientDetailsCard = ({ 
  client, 
  clientId, 
  isClientView
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
          isLoading={isSubmitting}
          isClientView={isClientView}
        />
      </CardContent>
    </Card>
  );
};
