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
// Use the type directly from integrations/supabase/types
import { ActivityType } from "@/integrations/supabase/types";

const AddEditClient = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [client, setClient] = useState<ClientFormData | null>(null);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await useClient(clientId);
      if (error) {
        console.error("Error fetching client:", error);
        toast({
          title: "Error",
          description: "Failed to fetch client details. Please try again.",
          variant: "destructive",
        });
      }
      if (data) {
        setClient({
          client_name: data.client_name,
          email: data.email,
          company: data.company,
          description: data.description,
          widget_settings: data.widget_settings,
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
      <PageHeading title={isEditMode ? "Edit Client" : "Add Client"} />
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
