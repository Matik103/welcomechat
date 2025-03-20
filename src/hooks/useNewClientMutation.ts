
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { createClient } from "@/services/clientService";
import { toast } from "sonner";
import { createOpenAIAssistant } from "@/utils/openAIUtils";
import { sendEmail } from "@/utils/emailUtils";
import { supabase } from "@/integrations/supabase/client";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        // Validate the data before sending to the service
        const validationResult = clientFormSchema.safeParse(data);
        if (!validationResult.success) {
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

        // Create the client with validated data
        const clientId = await createClient({
          client_name: validatedData.client_name.trim(),
          email: validatedData.email.trim().toLowerCase(),
          widget_settings: {
            agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
            agent_description: validatedData.widget_settings.agent_description?.trim() || "",
            logo_url: validatedData.widget_settings.logo_url || ""
          }
        });

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
            // We continue even if OpenAI assistant creation fails
            // The client is still created, and the assistant can be created later
          }
        }

        // Create user account and send welcome email with credentials
        try {
          // Call the edge function to create a user and generate temporary password
          const { data: userData, error: userError } = await supabase.functions.invoke("create-client-user", {
            body: {
              email: validatedData.email.trim().toLowerCase(),
              client_id: clientId,
              client_name: validatedData.client_name.trim(),
              agent_name: validatedData.widget_settings.agent_name?.trim() || "AI Assistant",
              agent_description: validatedData.widget_settings.agent_description?.trim() || "",
            }
          });

          if (userError) {
            console.error("Error creating user account:", userError);
            throw new Error("Failed to create user account");
          }

          if (userData && userData.temp_password) {
            // Send welcome email with the temporary password
            await sendEmail({
              to: validatedData.email.trim().toLowerCase(),
              subject: "Welcome to Welcome.Chat - Your Account Details",
              template: "client-invitation",
              params: {
                clientName: validatedData.client_name.trim(),
                email: validatedData.email.trim().toLowerCase(),
                tempPassword: userData.temp_password,
                productName: "Welcome.Chat"
              }
            });
            console.log("Welcome email sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // We continue even if email sending fails
          // The client is still created, and the email can be sent manually later
        }

        return clientId;
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
    onSuccess: () => {
      toast.success("Client created successfully! An email with credentials has been sent.");
    }
  });
};
