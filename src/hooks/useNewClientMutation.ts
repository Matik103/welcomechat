
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { saveClientTempPassword, generateTempPassword, logClientCreationActivity } from "@/utils/clientCreationUtils";
import { sendWelcomeEmail } from "@/utils/emailUtils";

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
        
        // Send welcome email directly using the email utility (which uses the send-email edge function)
        const emailResult = await sendWelcomeEmail(
          data.email,
          data.client_name,
          tempPassword
        );
        
        // Return the client data and email status
        return {
          client: clientData,
          emailSent: emailResult.emailSent,
          emailError: emailResult.emailError
        };
      } catch (error: any) {
        console.error("Error in useNewClientMutation:", error);
        throw error;
      }
    }
  });
};
