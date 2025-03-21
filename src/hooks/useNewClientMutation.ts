
import { useMutation } from "@tanstack/react-query";
import { ClientFormData, clientFormSchema } from "@/types/client-form";
import { toast } from "sonner";
import { createOpenAIAssistant } from "@/utils/openAIUtils";
import { sendEmail } from "@/utils/emailUtils";
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword } from "@/utils/passwordUtils";

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

        // Generate a temporary password for this client
        const tempPassword = generateClientTempPassword();
        console.log("Generated temporary password:", tempPassword);
        
        // Store the temporary password in the database
        try {
          const { error: tempPasswordError } = await supabase
            .from("client_temp_passwords")
            .insert({
              agent_id: clientId,
              email: validatedData.email.trim().toLowerCase(),
              temp_password: tempPassword
            });
          
          if (tempPasswordError) {
            console.error("Error saving temporary password:", tempPasswordError);
            throw new Error("Failed to save temporary password");
          }
          
          console.log("Temporary password saved to database");
        } catch (passwordError) {
          console.error("Error in password creation process:", passwordError);
          throw new Error("Failed to generate secure credentials");
        }
        
        // Create user account and send welcome email with credentials
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
              temp_password: tempPassword
            }
          });

          if (userError) {
            console.error("Error creating user account:", userError);
            throw new Error("Failed to create user account");
          }

          console.log("User account created successfully:", userData);
          
          // Send welcome email with the temporary password
          console.log("Sending welcome email to:", validatedData.email);
          
          const emailResult = await sendEmail({
            to: validatedData.email.trim().toLowerCase(),
            subject: "Welcome to Welcome.Chat - Your Account Details",
            template: "client-invitation",
            params: {
              clientName: validatedData.client_name.trim(),
              email: validatedData.email.trim().toLowerCase(),
              tempPassword: tempPassword,
              productName: "Welcome.Chat"
            }
          });
          
          console.log("Welcome email result:", emailResult);
          
          if (!emailResult.success) {
            console.error("Error sending welcome email:", emailResult.error);
            // We still return success since the client was created
            throw new Error(`Client created but email failed: ${emailResult.error}`);
          }
          
          console.log("Welcome email sent successfully");
        } catch (emailError) {
          console.error("Error in email/user creation process:", emailError);
          // Continue even if email sending fails, but we'll return detailed info
          return {
            clientId: clientId,
            agentId: newAgent.id,
            emailSent: false,
            emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
          };
        }

        return {
          clientId: clientId,
          agentId: newAgent.id,
          emailSent: true
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
      if (result.emailSent) {
        toast.success("Client created successfully! An email with credentials has been sent.");
      } else {
        toast.success("Client created successfully!");
        toast.error(`However, the welcome email could not be sent: ${result.emailError || "Unknown error"}`);
      }
    }
  });
};
