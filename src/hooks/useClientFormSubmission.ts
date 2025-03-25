
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { ActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  generateClientTempPassword, 
  saveClientTempPassword, 
  generateClientWelcomeEmailTemplate 
} from "@/utils/clientCreationUtils";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientMutation = useClientMutation(clientId);
  const navigate = useNavigate();
  
  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Display initial feedback toast
      const initialToastId = toast.loading(clientId ? "Updating client..." : "Creating client...");
      
      // Check for agent name or description changes to log appropriate activity
      const widgetSettings = data.widget_settings || {};
      
      // Perform the client mutation (create or update)
      const result = await clientMutation.mutateAsync(data);
      
      // Log activity based on user role and changes made
      if (isClientView) {
        await logClientActivity(
          "client_updated", 
          "Updated client information",
          {
            widget_settings: {
              agent_name: widgetSettings.agent_name,
              agent_description: widgetSettings.agent_description,
              logo_url: widgetSettings.logo_url
            }
          }
        );
        toast.success("Your information has been updated", { id: initialToastId });
      } else {
        if (clientId) {
          // Admin updating existing client
          await logClientActivity(
            "client_updated", 
            "Admin updated client information",
            {
              widget_settings: {
                agent_name: widgetSettings.agent_name,
                agent_description: widgetSettings.agent_description,
                logo_url: widgetSettings.logo_url
              }
            }
          );
          toast.success("Client updated successfully", { id: initialToastId });
        } else {
          // Admin creating new client
          
          // If a new client was created, handle welcome email
          if (typeof result === 'object' && result.agentId) {
            toast.loading("Sending welcome email...", { id: initialToastId });
            
            try {
              // Generate temporary password for the new client
              const tempPassword = generateClientTempPassword();
              
              // Save the temporary password
              await saveClientTempPassword(result.agentId, data.email, tempPassword);
              
              // Generate email template
              const emailHtml = generateClientWelcomeEmailTemplate(
                data.client_name,
                data.email,
                tempPassword
              );
              
              // Directly call the send-email edge function
              const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
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
              
              if (emailFnError) {
                console.error("Email function error:", emailFnError);
                toast.error("Client created but failed to send invitation email", { id: initialToastId });
              } else if (emailResult && !emailResult.success) {
                console.error("Email sending failed:", emailResult.error);
                toast.error("Client created but invitation email failed to send", { id: initialToastId });
              } else {
                toast.success("Client created successfully and invitation sent", { id: initialToastId });
              }
            } catch (emailErr) {
              console.error("Error sending welcome email:", emailErr);
              toast.error("Client created but invitation email failed to send", { id: initialToastId });
            }
          } else {
            toast.success("Client created successfully", { id: initialToastId });
          }
          
          navigate('/admin/clients');
        }
      }
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      toast.error(`Failed to ${clientId ? "update" : "create"} client: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    handleSubmit,
    isLoading,
    clientMutation
  };
};
