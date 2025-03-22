
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { logClientCreationActivity, generateClientWelcomeEmailTemplate, generateTempPassword } from "@/utils/clientCreationUtils";

export const useNewClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        console.log("Creating new client with data:", data);
        
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
        
        // Log client creation activity
        await logClientCreationActivity(
          clientData.id, 
          data.client_name, 
          data.email, 
          data.widget_settings?.agent_name || "AI Assistant"
        );
        
        // Generate a secure temporary password
        const tempPassword = generateTempPassword();
        
        // Create a Supabase auth user with our generated password
        let authResult = null;
        let authError = null;
        
        try {
          console.log("Creating Supabase auth user...");
          
          const { data: authData, error: authFnError } = await supabase.functions.invoke(
            'create-client-user', 
            {
              body: {
                client_id: clientData.id,
                client_name: data.client_name,
                email: data.email,
                agent_name: data.widget_settings?.agent_name || "AI Assistant",
                agent_description: data.widget_settings?.agent_description || "",
                temp_password: tempPassword
              }
            }
          );
          
          if (authFnError) {
            console.error("Auth function error:", authFnError);
            authError = authFnError.message;
          } else {
            authResult = authData;
            console.log("Supabase auth user created successfully:", authData);
          }
        } catch (authErr: any) {
          console.error("Exception creating auth user:", authErr);
          authError = authErr.message || "Exception occurred creating auth user";
        }
        
        // Send welcome email with the generated password
        let emailSent = false;
        let emailError = null;
        
        try {
          console.log("Sending welcome email...");
          
          // Generate enhanced email template with the temp password
          const emailHtml = generateClientWelcomeEmailTemplate(
            data.client_name,
            data.email,
            tempPassword,
            "Welcome.Chat"
          );
          
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
        
        // Invalidate clients query to force a refresh after creation
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        
        // Return the client data and email status
        return {
          client: clientData,
          authResult,
          authError,
          emailSent,
          emailError
        };
      } catch (error: any) {
        console.error("Error in useNewClientMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Additionally invalidate any related queries that might depend on clients data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientStats'] });
    }
  });
};
