
import { useState } from "react";
import { ClientFormValues } from "@/components/client/forms/ClientCreationForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateTempPassword, saveClientTempPassword } from "@/utils/passwordUtils";
import { setupOpenAIAssistant } from "@/utils/clientOpenAIUtils";
import { sendWelcomeEmail } from "@/utils/email/welcomeEmail";

export function useClientFormSubmit(onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate a client ID using crypto.randomUUID
      const clientId = crypto.randomUUID();
      const tempPassword = generateTempPassword();
      
      // Create AI agent (which creates the client record)
      const insertData = {
        client_id: clientId,
        client_name: values.clientName,
        email: values.email,
        name: values.agentName || "AI Assistant",
        agent_description: values.agentDescription || "",
        interaction_type: "config", 
        settings: {
          agent_name: values.agentName || "AI Assistant",
          agent_description: values.agentDescription || "",
          client_name: values.clientName,
          email: values.email
        },
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: "client_created"
      };
      
      // Insert into supabase handled by ClientCreationForm component

      // Set up OpenAI assistant
      try {
        await setupOpenAIAssistant(
          clientId,
          values.agentName || "AI Assistant",
          values.agentDescription || "A helpful assistant for " + values.clientName,
          values.clientName
        );
      } catch (openAiError) {
        console.error("Error setting up OpenAI assistant:", openAiError);
        toast.warning("Client created, but OpenAI assistant setup failed. You can retry setup later.");
      }
      
      const agentId = clientId;
      
      // Save temporary password
      try {
        await saveClientTempPassword(agentId, values.email, tempPassword);
        
        // Send welcome email with credentials
        const emailResult = await sendWelcomeEmail(
          values.email,
          values.clientName,
          tempPassword
        );
        
        if (emailResult.emailSent) {
          toast.success("Client created and welcome email sent successfully!");
        } else {
          toast.warning(`Client created but failed to send welcome email: ${emailResult.emailError}`);
          console.error("Failed to send welcome email:", emailResult.emailError);
        }
      } catch (error) {
        console.error("Error saving temporary password:", error);
        toast.warning("Client created but failed to set up login credentials.");
      }
      
      toast.success("Client created successfully!");
      onSuccess();
      navigate("/admin/clients");
    } catch (err: any) {
      console.error("Error creating client:", err);
      setError(err.message || "Failed to create client");
      toast.error(err.message || "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error
  };
}
