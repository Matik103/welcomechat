
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClientForm } from "@/components/client/ClientForm";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useClient } from "@/hooks/useClient";
import { createNewClient, updateClient } from "@/services/clientService";
import { ClientFormData } from "@/types/client-form";
import { Client } from "@/types/client";
import { createClientActivity } from "@/services/clientActivityService";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AddEditClient = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
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
  }, [clientId, clientData]);

  const fetchClientData = async (clientId: string) => {
    setLoading(true);
    try {
      if (clientData) {
        // Make sure we're setting the full Client object, not just ClientFormData
        setClient(clientData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (isEditMode && clientId) {
        await updateClient({
          client_id: clientId,
          client_name: data.client_name,
          email: data.email,
          agent_name: data.widget_settings?.agent_name
        });
        
        // Log client update activity
        await createClientActivity(
          clientId,
          'client_updated',
          `Client updated: ${data.client_name}`
        );
        
        toast.success("Client updated successfully.");
        navigate("/admin/clients");
      } else {
        // Create a new client
        const clientData = {
          client_name: data.client_name,
          email: data.email,
          agent_name: data.widget_settings?.agent_name || 'AI Assistant',
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path,
          widget_settings: data.widget_settings
        };
        
        const newClient = await createNewClient(clientData);
        toast.success("Client created successfully.");
        navigate("/admin/clients");
      }
    } catch (error: any) {
      console.error("Error creating/updating client:", error);
      toast.error(
        error?.message || "Failed to save client. Please try again."
      );
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
          initialData={client}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default AddEditClient;
