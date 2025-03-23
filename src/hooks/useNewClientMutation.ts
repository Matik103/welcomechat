
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { logClientCreationActivity, createClientInDatabase, setupClientPassword, createClientUserAccount } from "@/utils/clientAccountUtils";

export const useNewClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        console.log("Creating new client with data:", data);
        
        // Step 1: Create the client record in the database first to get a client_id
        const newAgent = await createClientInDatabase(data);
        console.log("Client created in database with ID:", newAgent.id);
        
        // Step 2: Generate and save a temporary password using client_id as the reference
        const tempPassword = await setupClientPassword(newAgent.id, data.email);
        console.log("Temporary password generated and saved:", tempPassword);
        
        // Step 3: Create the Supabase Auth user account with client_id
        const authResult = await createClientUserAccount(
          data.email,
          newAgent.id, // Use the newly created client_id
          data.client_name,
          data.widget_settings?.agent_name || "AI Assistant",
          data.widget_settings?.agent_description || "",
          tempPassword
        );
        
        console.log("Auth user account created:", authResult);
        
        // Step 4: Log the client creation activity
        await logClientCreationActivity(
          newAgent.id, 
          data.client_name, 
          data.email, 
          data.widget_settings?.agent_name || "AI Assistant"
        );
        
        // Step 5: Send welcome email with login credentials
        let emailSent = false;
        let emailError = null;
        
        try {
          const { data: emailResult, error: emailFnError } = await supabase.functions.invoke(
            'send-welcome-email', 
            {
              body: {
                clientId: newAgent.id,
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
        } catch (emailErr) {
          console.error("Exception sending email:", emailErr);
          emailError = emailErr.message || "Exception occurred sending email";
        }
        
        // Invalidate clients query to force a refresh after creation
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        
        // Return the results
        return {
          client: newAgent,
          authResult,
          emailSent,
          emailError
        };
      } catch (error) {
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
