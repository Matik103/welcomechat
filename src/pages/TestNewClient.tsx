
import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sendEmail } from "@/utils/emailUtils";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

export default function TestNewClient() {
  const navigate = useNavigate();
  const { mutateAsync: createClient, isPending } = useNewClientMutation();
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

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
      
      toast.dismiss();
      toast.success("Client created successfully!");
      
      // Store client information for sending invitation later
      setClientId(result.clientId);
      setClientEmail(data.email);
      setClientName(data.client_name);
      setSuccess(true);
    } catch (error) {
      console.error("Error creating client:", error);
      toast.dismiss();
      toast.error(error instanceof Error && error.message ? error.message : "Failed to create client");
    }
  };

  const handleSendInvitation = async () => {
    if (!clientId || !clientEmail || !clientName) {
      toast.error("Missing client information");
      return;
    }

    try {
      setIsSendingInvitation(true);
      toast.loading("Sending invitation...");

      // Generate temporary password
      const tempPassword = generateClientTempPassword();
      
      // Store the temporary password
      const { error: tempPasswordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: clientId,
          email: clientEmail,
          temp_password: tempPassword
        });
        
      if (tempPasswordError) {
        throw new Error("Failed to save temporary password");
      }
      
      // Send welcome email
      const emailResult = await sendEmail({
        to: clientEmail,
        subject: "Welcome to Welcome.Chat - Your Account Details",
        template: "client-invitation",
        params: {
          clientName: clientName,
          email: clientEmail,
          tempPassword: tempPassword,
          productName: "Welcome.Chat"
        }
      });
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send invitation email");
      }
      
      // Update invitation status - use a simpler approach without the rpc function
      const { data: currentData } = await supabase
        .from("ai_agents")
        .select("settings")
        .eq("id", clientId)
        .single();
      
      // Now create a merged settings object
      const updatedSettings = {
        ...((currentData?.settings || {}) as object),
        invitation_status: "sent"
      };
      
      // Update both the settings object and the dedicated field
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({ 
          settings: updatedSettings,
          invitation_status: "sent"
        })
        .eq("id", clientId);
        
      if (updateError) {
        throw new Error("Failed to update invitation status");
      }

      // Log activity
      await supabase
        .from("client_activities")
        .insert({
          client_id: clientId,
          activity_type: "system_update",
          description: "Invitation email sent to client",
          metadata: { email: clientEmail }
        });
      
      toast.dismiss();
      toast.success("Invitation sent successfully");
      setInvitationSent(true);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const handleCreateAnother = () => {
    setSuccess(false);
    setClientId(null);
    setClientEmail(null);
    setClientName(null);
    setInvitationSent(false);
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
            
            {invitationSent ? (
              <div className="mb-6">
                <p className="text-green-600 font-medium mb-2">Invitation email has been sent to the client.</p>
                <p className="text-gray-600">They can now log in using the credentials provided in the email.</p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="mb-4">Click the button below to send an invitation email with login credentials to this client.</p>
                <Button 
                  onClick={handleSendInvitation} 
                  disabled={isSendingInvitation}
                  className="mb-4"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSendingInvitation ? "Sending Invitation..." : "Send Invitation Email"}
                </Button>
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
