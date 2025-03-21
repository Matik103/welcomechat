import { NewClientForm } from "@/components/client/NewClientForm";
import { ClientFormData } from "@/types/client-form";
import { useNewClientMutation } from "@/hooks/useNewClientMutation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { sendWelcomeEmail } from "@/utils/emailUtils";
import { supabase } from "@/integrations/supabase/client";

export default function TestNewClient() {
  const navigate = useNavigate();
  const { mutateAsync: createClient, isPending } = useNewClientMutation();
  const [success, setSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);

  const handleTestEmail = async () => {
    try {
      const toastId = toast.loading("Sending test email...");
      
      // First, test the Supabase connection
      const { data: testData, error: testError } = await supabase
        .from('ai_agents')
        .select('count(*)')
        .limit(1);
        
      if (testError) {
        console.error("Supabase connection test failed:", testError);
        toast.error("Failed to connect to Supabase", { id: toastId });
        return;
      }
      
      console.log("Supabase connection test successful");
      
      // Try calling the Edge Function directly with a well-formatted test email
      console.log("Calling send-email Edge Function directly...");
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        "send-email",
        {
          body: {
            to: "temple@gmail.com",
            subject: "Test Email from Welcome.Chat",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #4f46e5;">Welcome.Chat Test Email</h1>
                </div>
                
                <p>Hello,</p>
                
                <p>This is a test email to verify the email sending functionality is working correctly.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Test Details:</strong></p>
                  <ul style="list-style-type: none; padding: 0;">
                    <li>Time: ${new Date().toLocaleString()}</li>
                    <li>Environment: Development</li>
                    <li>Service: Resend.com</li>
                  </ul>
                </div>
                
                <p>If you received this email, it means the email sending functionality is working properly.</p>
                
                <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} Welcome.Chat - Test Email
                </div>
              </div>
            `,
            from: "Welcome.Chat <admin@welcome.chat>"
          }
        }
      );
      
      console.log("Edge Function response:", { data: emailData, error: emailError });
      
      if (emailError) {
        console.error("Edge Function error:", emailError);
        toast.error(`Edge Function error: ${emailError.message}`, { id: toastId });
        return;
      }
      
      if (emailData?.success) {
        toast.success("Test email sent successfully!", { id: toastId });
      } else {
        console.error("Email send failed:", emailData?.error);
        toast.error(`Failed to send test email: ${emailData?.error}`, { id: toastId });
      }
    } catch (error) {
      console.error("Error in handleTestEmail:", error);
      toast.error(`Error sending test email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

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
      
      toast.loading("Creating client account and sending welcome email...");
      
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
      
      <Button 
        onClick={handleTestEmail}
        className="mb-4"
        variant="outline"
      >
        Send Test Email
      </Button>
      
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
