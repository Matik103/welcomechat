
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { toast } from "sonner";
import { createOpenAIAssistant } from "@/utils/openAIUtils";
import { supabase } from "@/integrations/supabase/client";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        // Validate the data before sending to the service
        const validationResult = clientFormSchema.safeParse(data);
        if (!validationResult.success) {
          console.error("Validation errors:", validationResult.error.format());
          throw new Error("Invalid form data");
        }

        // Ensure widget_settings is properly defined
        const validatedData = validationResult.data;
        if (!validatedData.widget_settings) {
          validatedData.widget_settings = {
            agent_name: "",
            agent_description: "",
            logo_url: ""
          };
        }

        console.log("Creating client with data:", validatedData);

        // Create the client directly in the ai_agents table
        const { data: newAgent, error } = await supabase
          .from("ai_agents")
          .insert({
            name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
            agent_description: validatedData.widget_settings.agent_description?.trim() || "",
            logo_url: validatedData.widget_settings.logo_url || "",
            status: 'active',
            content: '',
            interaction_type: 'config',
            client_name: validatedData.client_name.trim(),
            email: validatedData.email.trim().toLowerCase(),
            invitation_status: 'pending',
            settings: {
              client_name: validatedData.client_name.trim(),
              email: validatedData.email.trim().toLowerCase(),
              agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
              agent_description: validatedData.widget_settings.agent_description?.trim() || "",
              logo_url: validatedData.widget_settings.logo_url || ""
            }
          })
          .select("id, client_id")
          .single();

        if (error) {
          console.error("Error creating client in ai_agents:", error);
          throw new Error(error.message || "Failed to create client");
        }

        if (!newAgent) {
          throw new Error("Failed to create client record");
        }

        console.log("Client created successfully:", newAgent);

        // Get clientId - either from the client_id field or use the id if client_id is not set
        const clientId = newAgent.client_id || newAgent.id;

        // Log the client creation to ensure it shows up in Recent Activity
        try {
          await supabase.from("client_activities").insert({
            client_id: clientId,
            activity_type: "client_created",
            description: "New client created with AI agent",
            metadata: {
              client_name: validatedData.client_name.trim(),
              email: validatedData.email.trim().toLowerCase(),
              agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant"
            }
          });
        } catch (activityError) {
          console.error("Error logging client creation activity:", activityError);
          // Continue even if activity logging fails
        }

        // Create OpenAI assistant using the client's chatbot settings
        if (validatedData.widget_settings.agent_name || validatedData.widget_settings.agent_description) {
          try {
            await createOpenAIAssistant(
              clientId,
              validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
              validatedData.widget_settings.agent_description?.trim() || "",
              validatedData.client_name.trim()
            );
          } catch (openaiError) {
            console.error("Error creating OpenAI assistant:", openaiError);
            // Continue even if OpenAI assistant creation fails
          }
        }

        // Create user account in the edge function
        try {
          console.log("Starting user account creation for:", validatedData.email);
          
          // Call the edge function to create a user
          const { data: userData, error: userError } = await supabase.functions.invoke("create-client-user", {
            body: {
              email: validatedData.email.trim().toLowerCase(),
              client_id: clientId,
              client_name: validatedData.client_name.trim(),
              agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
              agent_description: validatedData.widget_settings.agent_description?.trim() || "",
              skip_invitation: true // Skip sending invitation email
            }
          });

          if (userError) {
            console.error("Error creating user account:", userError);
            throw new Error("Failed to create user account");
          }

          console.log("User account created successfully:", userData);
        } catch (userError) {
          console.error("Error in user creation process:", userError);
          // Continue even if user creation fails, but we'll return detailed info
          return {
            clientId: clientId,
            agentId: newAgent.id,
            userCreated: false,
            userError: userError instanceof Error ? userError.message : "Unknown user creation error"
          };
        }

        return {
          clientId: clientId,
          agentId: newAgent.id,
          userCreated: true
        };
      } catch (error) {
        console.error("Error creating client:", error);
        // Ensure we always have a meaningful error message
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Failed to create client. Please try again.");
        }
      }
    },
    onError: (error: Error) => {
      // Make sure we have a user-friendly error message
      const errorMessage = error.message || "Failed to create client. Please try again.";
      toast.error(errorMessage);
    },
    onSuccess: (result) => {
      if (result.userCreated) {
        toast.success("Client created successfully!");
      } else {
        toast.success("Client created successfully!");
        toast.error(`However, the user account could not be created: ${result.userError || "Unknown error"}`);
      }
    }
  });
};
