
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/emailUtils";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>
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
          
          // If a temp password was generated as part of client creation, send welcome email
          if (typeof result === 'object' && result.agentId) {
            toast.loading("Sending welcome email...", { id: initialToastId });
            
            try {
              // Get the temporary password from client_temp_passwords
              const { data: tempPasswordData, error: tempPasswordError } = await supabase
                .from('client_temp_passwords')
                .select('temp_password')
                .eq('agent_id', result.agentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (tempPasswordError || !tempPasswordData) {
                console.error("Error retrieving temporary password:", tempPasswordError);
                toast.error("Created client but failed to retrieve credentials", { id: initialToastId });
              } else {
                // Send welcome email with credentials
                const emailResult = await sendEmail({
                  to: data.email,
                  subject: "Welcome to Welcome.Chat - Your Account Details",
                  template: "client-invitation",
                  params: {
                    clientName: data.client_name,
                    email: data.email,
                    tempPassword: tempPasswordData.temp_password,
                    productName: "Welcome.Chat"
                  }
                });
                
                if (!emailResult.success) {
                  console.error("Email sending failed:", emailResult.error);
                  toast.error("Client created but invitation email failed to send", { id: initialToastId });
                } else {
                  toast.success("Client created successfully and invitation sent", { id: initialToastId });
                }
              }
            } catch (emailError) {
              console.error("Error sending welcome email:", emailError);
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
