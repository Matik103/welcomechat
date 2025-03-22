
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { generateTempPassword, saveClientTempPassword, generateClientWelcomeEmailTemplate } from "@/utils/clientCreationUtils";

export default function NewClient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Show loading toast
      const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      console.log("Creating client with data:", data);
      console.log("Using temporary password:", tempPassword);

      // Create the client/agent in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          company: data.company || null,
          name: data.bot_settings?.bot_name || "AI Assistant",
          agent_description: data.bot_settings?.bot_personality || "", 
          content: "",
          interaction_type: 'config',
          settings: {
            agent_name: data.bot_settings?.bot_name || "AI Assistant",
            agent_description: data.bot_settings?.bot_personality || "",
            logo_url: "",
            client_name: data.client_name,
            email: data.email,
            company: data.company || null
          }
        })
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);
      
      console.log("Client created successfully:", clientData);
      
      // Save the temporary password
      await saveClientTempPassword(clientData.id, data.email, tempPassword);

      // Generate a well-formatted email template
      const emailHtml = generateClientWelcomeEmailTemplate(
        data.client_name,
        data.email,
        tempPassword
      );

      // Call the edge function to send the welcome email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-email', 
        {
          body: {
            to: data.email,
            subject: "Welcome to Welcome.Chat - Your Account Details",
            html: emailHtml,
            from: "Welcome.Chat <admin@welcome.chat>"
          }
        }
      );
      
      if (emailError) {
        console.error("Email sending error:", emailError);
        toast.error(`Client created but welcome email failed: ${emailError.message}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else if (emailResult && !emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        toast.error(`Client created but welcome email failed: ${emailResult.error || "Unknown error"}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else {
        toast.success("Client created successfully and welcome email sent", {
          id: loadingToastId
        });
      }
      
      // Create OpenAI assistant with the description (this would be automatically handled by a trigger)
      try {
        const { data: assistantResult, error: assistantError } = await supabase.functions.invoke(
          'create-openai-assistant',
          {
            body: {
              client_id: clientData.id,
              agent_name: data.bot_settings?.bot_name || "AI Assistant",
              agent_description: data.bot_settings?.bot_personality || "",
              client_name: data.client_name
            }
          }
        );
        
        if (assistantError) {
          console.error("Failed to create OpenAI assistant:", assistantError);
        } else {
          console.log("OpenAI assistant created:", assistantResult);
        }
      } catch (assistantErr) {
        console.error("Error creating OpenAI assistant:", assistantErr);
        // Continue even if assistant creation fails
      }
      
      // Force refresh of client list
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Short delay before navigating to ensure notifications are visible
      setTimeout(() => {
        navigate("/admin/clients");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Register New AI Agent</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientRegistrationForm onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Client Creation Process</AlertTitle>
                <AlertDescription>
                  When you submit the form, we'll:
                  <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                    <li>Create a new AI agent in the database</li>
                    <li>Generate a secure temporary password</li>
                    <li>Send a welcome email with login details</li>
                    <li>Set up the OpenAI assistant (if enabled)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
