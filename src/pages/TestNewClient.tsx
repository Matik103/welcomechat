
import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SendClientInvitation } from "@/components/client/SendClientInvitation";

export default function TestNewClient() {
  const navigate = useNavigate();
  const { mutateAsync: createClient, isPending } = useNewClientMutation();
  const [success, setSuccess] = useState(false);
  const [createdClient, setCreatedClient] = useState<{
    clientId: string;
    clientName: string;
    email: string;
    invitationSent: boolean;
  } | null>(null);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Form data received in TestNewClient:", data);
      
      // Ensure required fields have values
      if (!data.client_name || !data.email) {
        toast.error("Client name and email are required");
        return;
      }
      
      // Ensure widget_settings is defined with default values
      if (!data.widget_settings) {
        data.widget_settings = {
          agent_name: "",
          agent_description: "",
          logo_url: "",
        };
      }
      
      toast.loading("Creating client account...");
      
      const result = await createClient(data);
      console.log("Client creation result:", result);
      
      // Store the created client information for invitation sending
      setCreatedClient({
        clientId: result.clientId,
        clientName: data.client_name,
        email: data.email,
        invitationSent: false
      });
      
      toast.success("Client created successfully!");
      setSuccess(true);
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error && error.message ? error.message : "Failed to create client");
    }
  };

  const handleCreateAnother = () => {
    setSuccess(false);
    setCreatedClient(null);
  };

  const handleGoToClients = () => {
    navigate("/admin/clients");
  };

  const handleInvitationSent = () => {
    if (createdClient) {
      setCreatedClient({
        ...createdClient,
        invitationSent: true
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <PageHeading>Create New Client</PageHeading>
      
      {success ? (
        <Card className="p-6 mt-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Client Created Successfully!</h2>
            
            {createdClient && (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  The client account has been set up. You can now send an invitation email with login credentials.
                </p>
                
                <SendClientInvitation 
                  clientId={createdClient.clientId}
                  clientName={createdClient.clientName}
                  email={createdClient.email}
                  invitationSent={createdClient.invitationSent}
                  onInvitationSent={handleInvitationSent}
                />
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button onClick={handleCreateAnother}>Create Another Client</Button>
              <Button variant="outline" onClick={handleGoToClients}>Go to Clients List</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 mt-6">
          <NewClientForm 
            onSubmit={handleSubmit} 
            isSubmitting={isPending}
            initialData={{
              widget_settings: {
                agent_name: "",
                agent_description: "",
                logo_url: "",
              }
            }}  
          />
        </Card>
      )}
    </div>
  );
};
