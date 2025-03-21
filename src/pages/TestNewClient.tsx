
import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TestNewClient() {
  const navigate = useNavigate();
  const { mutateAsync: createClient, isPending } = useNewClientMutation();
  const [success, setSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Form data received in TestNewClient:", data);
      
      // Clear any existing toasts
      toast.dismiss();
      
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
      
      toast.dismiss(); // Clear the loading toast
      
      // Set email status for display in the success screen
      setEmailStatus({
        sent: result.emailSent === true,
        error: result.emailError
      });
      
      if (result.emailSent) {
        toast.success(`Client created successfully! An email with login credentials has been sent to ${data.email}`);
      } else {
        toast.success("Client created successfully!");
        if (result.emailError) {
          toast.error(`However, the welcome email could not be sent: ${result.emailError}`);
        } else {
          toast.warning("No welcome email was sent. Please check the logs for details.");
        }
      }
      
      setSuccess(true);
    } catch (error) {
      console.error("Error creating client:", error);
      toast.dismiss(); // Clear the loading toast
      toast.error(error instanceof Error && error.message ? error.message : "Failed to create client");
    }
  };

  const handleCreateAnother = () => {
    setSuccess(false);
    setEmailStatus(null);
  };

  const handleGoToClients = () => {
    navigate("/admin/clients");
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <PageHeading>Create New Client</PageHeading>
      
      {success ? (
        <Card className="p-6 mt-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Client Created Successfully!</h2>
            
            {emailStatus && (
              <div className="mb-4">
                {emailStatus.sent ? (
                  <p className="text-green-600 mb-2">
                    ✅ An email with login credentials has been sent to the client.
                  </p>
                ) : (
                  <div className="text-amber-600 mb-2">
                    <p className="font-medium">⚠️ The welcome email could not be sent.</p>
                    {emailStatus.error && (
                      <p className="text-sm mt-1 p-2 bg-amber-50 rounded">Error: {emailStatus.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
