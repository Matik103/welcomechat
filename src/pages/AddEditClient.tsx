
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientForm } from "@/components/client/ClientForm";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useClient } from "@/hooks/useClient";
import { createClient, updateClient, logClientUpdateActivity } from "@/services/clientService";
import { useToast } from "@/components/ui/use-toast";
import { ClientFormData } from "@/types/client";
import { createClientActivity } from "@/services/clientActivityService";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExtendedActivityType } from "@/types/activity";

const AddEditClient = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [client, setClient] = useState<ClientFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const { client: clientData, isLoading, error } = useClient(clientId || '');

  useEffect(() => {
    if (clientId) {
      setIsEditMode(true);
      fetchClientData(clientId);
    } else {
      setIsEditMode(false);
      setLoading(false);
    }
  }, [clientId]);

  const fetchClientData = async (clientId: string) => {
    setLoading(true);
    try {
      if (clientData) {
        setClient({
          client_name: clientData.client_name,
          email: clientData.email,
          company: clientData.company,
          description: clientData.description,
          widget_settings: clientData.widget_settings,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (isEditMode && clientId) {
        await updateClient(clientId, data);
        await logClientUpdateActivity(clientId);
        toast({
          title: "Success",
          description: "Client updated successfully.",
        });
        navigate("/admin/clients");
      } else {
        const newClientId = await createClient(data);
        toast({
          title: "Success",
          description: "Client created successfully.",
        });
        navigate("/admin/clients");
      }
    } catch (error: any) {
      console.error("Error creating/updating client:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to save client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    navigate("/admin/clients");
  };

  return (
    <div className="container py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
      <PageHeading>
        {isEditMode ? "Edit Client" : "Add Client"}
      </PageHeading>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ClientForm
          onSubmit={handleSubmit}
          initialValues={client}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
};

export default AddEditClient;
