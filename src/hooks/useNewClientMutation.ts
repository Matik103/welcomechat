
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { saveClientTempPassword, generateTempPassword, logClientCreationActivity } from "@/utils/clientCreationUtils";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        console.log("Creating new client with data:", data);
        
        // Generate temporary password
        const tempPassword = generateTempPassword();
        
        // Create the client/agent in ai_agents table
        const { data: clientData, error: clientError } = await supabase
          .from('ai_agents')
          .insert({
            client_name: data.client_name,
            email: data.email,
            company: data.company || null,
            name: data.widget_settings?.agent_name || "AI Assistant",
            agent_description: data.widget_settings?.agent_description || "",
            content: "",
            interaction_type: 'config',
            settings: {
              agent_name: data.widget_settings?.agent_name || "AI Assistant",
              agent_description: data.widget_settings?.agent_description || "",
              logo_url: data.widget_settings?.logo_url || "",
              client_name: data.client_name,
              email: data.email,
              company: data.company || null
            }
          })
          .select()
          .single();

        if (clientError) throw new Error(clientError.message);
        
        // Save temporary password
        await saveClientTempPassword(clientData.id, data.email, tempPassword);
        
        // Log client creation activity
        await logClientCreationActivity(
          clientData.id, 
          data.client_name, 
          data.email, 
          data.widget_settings?.agent_name || "AI Assistant"
        );
        
        // Call the edge function directly to send the welcome email
        let emailSent = false;
        let emailError = null;
        
        try {
          console.log("Sending welcome email...");
          
          // Direct edge function call, similar to DeleteClientDialog approach
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
            emailError = emailFnError.message;
          } else if (emailResult && !emailResult.success) {
            console.error("Email sending failed:", emailResult.error);
            emailError = emailResult.error || "Unknown error sending email";
          } else {
            emailSent = true;
            console.log("Welcome email sent successfully");
          }
        } catch (emailErr: any) {
          console.error("Exception sending email:", emailErr);
          emailError = emailErr.message || "Exception occurred sending email";
        }
        
        // Return the client data and email status
        return {
          client: clientData,
          emailSent,
          emailError
        };
      } catch (error: any) {
        console.error("Error in useNewClientMutation:", error);
        throw error;
      }
    }
  });
};
