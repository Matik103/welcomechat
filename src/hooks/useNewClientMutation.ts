
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { createClientInDatabase, setupClientPassword, createClientUserAccount, logClientCreationActivity } from "@/utils/clientAccountUtils";
import { v4 as uuidv4 } from 'uuid';

export const useNewClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        console.log("Creating new client with data:", data);
        
        // Generate a separate client_id first
        const uniqueClientId = uuidv4();
        console.log("Generated unique client_id:", uniqueClientId);
        
        // Step 1: Create the client record in the database with the generated client_id
        const newAgent = await createClientInDatabase(data, uniqueClientId);
        console.log("Client created in database with agent ID:", newAgent.id, "and client_id:", uniqueClientId);
        
        // Make sure client_id is properly set
        if (newAgent.client_id !== uniqueClientId) {
          const { error: updateError } = await supabase
            .from("ai_agents")
            .update({ client_id: uniqueClientId })
            .eq("id", newAgent.id);
            
          if (updateError) {
            console.error("Error setting client_id:", updateError);
            throw new Error("Failed to set client_id");
          }
          
          console.log("Updated client_id to:", uniqueClientId);
        }
        
        // Step 2: Generate and save a temporary password using client_id as the reference
        const tempPassword = await setupClientPassword(uniqueClientId, data.email);
        console.log("Temporary password generated and saved:", tempPassword);
        
        // Step 3: Create the Supabase Auth user account with client_id
        const authResult = await createClientUserAccount(
          data.email,
          uniqueClientId, // Use the generated client_id
          data.client_name,
          data.widget_settings?.agent_name || "AI Assistant",
          data.widget_settings?.agent_description || "",
          tempPassword
        );
        
        console.log("Auth user account created:", authResult);
        
        // Step 4: Log the client creation activity
        await logClientCreationActivity(
          uniqueClientId, 
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
                clientId: uniqueClientId,
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
          client: {
            ...newAgent,
            client_id: uniqueClientId // Ensure client_id is in the response
          },
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
