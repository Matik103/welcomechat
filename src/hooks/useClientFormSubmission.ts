
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateTempPassword, saveClientTempPassword } from "@/utils/clientCreationUtils";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientMutation = useClientMutation(clientId);
  const navigate = useNavigate();
  
  const handleSubmit = async (data: any) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    try {
      // Create a single toast ID to update later
      const toastId = toast.loading(clientId ? "Updating client..." : "Creating client...");
      
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
        toast.success("Your information has been updated", { id: toastId });
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
          toast.success("Client updated successfully", { id: toastId });
        } else {
          // Admin creating new client
          
          // If a new client was created, handle welcome email
          if (typeof result === 'object' && result.agentId) {
            toast.loading("Sending welcome email...", { id: toastId });
            
            try {
              // Generate temporary password for the new client
              const tempPassword = generateTempPassword();
              
              // Save the temporary password
              await saveClientTempPassword(result.agentId, data.email, tempPassword);
              
              // Send welcome email
              const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
                'send-email', 
                {
                  body: {
                    to: data.email,
                    subject: "Welcome to Welcome.Chat - Your Account Details",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                          <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
                        </div>
                        
                        <p>Hello ${data.client_name || 'Client'},</p>
                        
                        <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                          <p><strong>Email Address:</strong></p>
                          <p style="color: #4f46e5;">${data.email || ''}</p>
                          
                          <p><strong>Temporary Password:</strong></p>
                          <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword || ''}</p>
                        </div>
                        
                        <p>To get started:</p>
                        <ol>
                          <li>Click the "Sign In" button below</li>
                          <li>Enter your email and temporary password exactly as shown above</li>
                          <li>You'll be taken to your client dashboard</li>
                          <li>Configure your AI assistant's settings</li>
                        </ol>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://welcomeai.io/client/auth" 
                             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Sign In
                          </a>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
                          <p><strong>Security Notice:</strong></p>
                          <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
                        </div>
                        
                        <p>Best regards,<br>The Welcome.Chat Team</p>
                        
                        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
                        </div>
                      </div>
                    `,
                    from: "Welcome.Chat <admin@welcome.chat>"
                  }
                }
              );
              
              if (emailFnError) {
                console.error("Email function error:", emailFnError);
                toast.error("Client created but failed to send invitation email", { id: toastId });
              } else if (emailResult && !emailResult.success) {
                console.error("Email sending failed:", emailResult.error);
                toast.error("Client created but invitation email failed to send", { id: toastId });
              } else {
                toast.success("Client created successfully and invitation sent", { id: toastId });
              }
            } catch (emailErr) {
              console.error("Error sending welcome email:", emailErr);
              toast.error("Client created but invitation email failed to send", { id: toastId });
            }
          } else {
            toast.success("Client created successfully", { id: toastId });
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
