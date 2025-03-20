
import { ClientForm } from "@/components/client/ClientForm";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClientMutation } from "@/hooks/useClientMutation";
import { useClient } from "@/hooks/useClient";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClientDetailsCard } from "@/components/client/ClientDetailsCard";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { ClientStats } from "@/components/client/ClientStats";
import { logClientActivity } from "@/services/clientActivityService";
import { Card } from "@/components/ui/card";
import { ActivityType, Json } from "@/integrations/supabase/types";

export default function AddEditClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(clientId);

  const { client, isLoading: isLoadingClient } = useClient(clientId || '');
  const clientMutation = useClientMutation(clientId);
  
  // Track if this is a new client form
  const [isNewClient, setIsNewClient] = useState(true);
  
  // Log client activity
  const logActivity = async (
    activityType: ActivityType,
    description: string,
    metadata?: Json
  ) => {
    if (!clientId) return;
    try {
      await logClientActivity(clientId, activityType, description, metadata);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Check if we're editing or creating a client
  useEffect(() => {
    if (clientId) {
      setIsNewClient(false);
    }
  }, [clientId]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      // Handle logo file upload
      if (data._tempLogoFile) {
        // File upload would be handled here if needed
        delete data._tempLogoFile;
      }

      // Update or create client
      const result = await clientMutation.mutateAsync(data);
      
      if (isNewClient) {
        // Navigate to the client details page if this is a new client
        toast.success("Client created successfully!");
        navigate(`/admin/clients/${result}`);
      } else {
        toast.success("Client updated successfully!");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save client");
    }
  };

  // Show loading state
  if (isEdit && isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <PageHeading>{isEdit ? "Edit Client" : "Add New Client"}</PageHeading>
        {isEdit && (
          <Button variant="outline" asChild>
            <Link to={`/admin/clients/${clientId}/view`}>View Client</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <ClientForm
              initialData={isEdit ? client : null}
              onSubmit={handleSubmit}
              isLoading={clientMutation.isPending}
            />
          </Card>

          {isEdit && clientId && (
            <ClientResourceSections 
              clientId={clientId} 
              agentName={client?.agent_name || client?.name || 'AI Assistant'}
              className="mt-8"
              isClientView={false}
              logClientActivity={logActivity}
            />
          )}
        </div>

        {isEdit && client && (
          <div className="space-y-8">
            <ClientStats 
              clientId={clientId}
              agentName={client.agent_name || client.name || 'AI Assistant'} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
