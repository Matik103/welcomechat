
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
        
        // Call the edge function to send the welcome email
        let emailSent = false;
        let emailError = null;
        
        try {
          const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
            'send-welcome-email', 
            {
              body: {
                clientId: clientData.id,
                clientName: data.client_name,
                email: data.email,
                agentName: data.widget_settings?.agent_name || "AI Assistant",
                tempPassword: tempPassword
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
