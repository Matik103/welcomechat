
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { setupClientPassword, createClientUserAccount, logClientCreationActivity } from "@/utils/clientAccountUtils";
import { v4 as uuidv4 } from 'uuid';

export const useNewClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        console.log("Creating new agent with data:", data);
        
        // Generate a separate client_id first
        const uniqueClientId = uuidv4();
        console.log("Generated unique client_id:", uniqueClientId);
        
        // Step 1: Create the agent record in the database with the generated client_id
        const newAgent = await createAgentInDatabase(data, uniqueClientId);
        console.log("Agent created in database with agent ID:", newAgent.id, "and client_id:", uniqueClientId);
        
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

// Function to create agent in database
async function createAgentInDatabase(data: ClientFormData, clientId: string): Promise<any> {
  try {
    console.log("Creating agent in database with client_id:", clientId);
    
    // Sanitize agent name and description
    const sanitizedAgentName = data.widget_settings?.agent_name?.replace(/["']/g, "") || "AI Assistant";
    const sanitizedAgentDescription = data.widget_settings?.agent_description?.replace(/["']/g, "") || "";

    // Insert the agent record
    const { data: newAgent, error } = await supabase
      .from("ai_agents")
      .insert({
        client_name: data.client_name,
        email: data.email,
        name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        logo_url: data.widget_settings?.logo_url || null,
        logo_storage_path: data.widget_settings?.logo_storage_path || null,
        client_id: clientId, // Explicitly set the client_id
        content: "",
        interaction_type: 'config',
        settings: {
          client_name: data.client_name,
          email: data.email,
          agent_name: sanitizedAgentName,
          agent_description: sanitizedAgentDescription,
          logo_url: data.widget_settings?.logo_url,
          logo_storage_path: data.widget_settings?.logo_storage_path,
          client_id: clientId // Include client_id in settings for consistency
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent in database:", error);
      throw new Error(error.message);
    }

    if (!newAgent) {
      throw new Error("Failed to create agent - no record returned");
    }

    console.log("Agent created in database successfully:", newAgent);
    return newAgent;
  } catch (error: any) {
    console.error("Error in createAgentInDatabase:", error);
    throw new Error(error?.message || "Failed to create agent in database");
  }
}
