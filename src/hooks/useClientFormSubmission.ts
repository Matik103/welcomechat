
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { ActivityType, ClientFormData } from "@/types/client-form";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateTempPassword, saveClientTempPassword } from "@/utils/clientCreationUtils";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientMutation = useClientMutation(clientId);
  const navigate = useNavigate();
  
  const handleSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      // Display initial feedback toast
      const initialToastId = toast.loading(clientId ? "Updating client..." : "Creating client...");
      
      // Ensure data conforms to ClientFormData type
      const formData: ClientFormData = {
        client_name: data.client_name,
        email: data.email,
        client_id: data.client_id,
        widget_settings: data.widget_settings || {},
        _tempLogoFile: data._tempLogoFile
      };
      
      // Perform the client mutation (create or update)
      const result = await clientMutation.mutateAsync(formData);
      
      // Log activity based on user role and changes made
      if (isClientView) {
        await logClientActivity(
          "client_updated", 
          "Updated client information",
          {
            widget_settings: data.widget_settings
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
              widget_settings: data.widget_settings
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
              const tempPassword = generateTempPassword();
              
              // Save the temporary password
              await saveClientTempPassword(result.agentId, data.email, tempPassword);
              
              // Directly call the send-email edge function
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
