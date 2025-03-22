
import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TestEmailComponent } from "@/components/client/TestEmailComponent";
import { useQueryClient } from "@tanstack/react-query";

export default function NewClient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (data: any) => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
      
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      console.log("Creating client with data:", data);
      console.log("Using temporary password:", tempPassword);

      // Create the client/agent in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          client_name: data.client_name,
          email: data.email,
          company: data.company || null,
          name: data.bot_settings?.bot_name || "AI Assistant",
          agent_description: data.bot_settings?.bot_personality || "", 
          content: "",
          interaction_type: 'config',
          settings: {
            agent_name: data.bot_settings?.bot_name || "AI Assistant",
            agent_description: data.bot_settings?.bot_personality || "",
            logo_url: "",
            client_name: data.client_name,
            email: data.email,
            company: data.company || null
          }
        })
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);
      
      console.log("Client created successfully:", clientData);
      
      // Save the temporary password
      const { error: passwordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: clientData.id,
          email: data.email,
          temp_password: tempPassword
        });
        
      if (passwordError) {
        console.error("Error saving temporary password:", passwordError);
        // Continue even if password save fails
      }

      // Call the edge function to send the welcome email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke(
        'send-welcome-email', 
        {
          body: {
            clientId: clientData.id,
            clientName: data.client_name,
            email: data.email,
            agentName: data.bot_settings?.bot_name || "AI Assistant",
            tempPassword: tempPassword
          }
        }
      );
      
      if (emailError) {
        console.error("Email sending error:", emailError);
        toast.error(`Client created but welcome email failed: ${emailError.message}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else if (emailResult && !emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        toast.error(`Client created but welcome email failed: ${emailResult.error || "Unknown error"}`, {
          id: loadingToastId,
          duration: 6000
        });
      } else {
        toast.success("Client created successfully and welcome email sent", {
          id: loadingToastId
        });
      }
      
      // Create OpenAI assistant with the description (this would be automatically handled by a trigger)
      try {
        const { data: assistantResult, error: assistantError } = await supabase.functions.invoke(
          'create-openai-assistant',
          {
            body: {
              client_id: clientData.id,
              agent_name: data.bot_settings?.bot_name || "AI Assistant",
              agent_description: data.bot_settings?.bot_personality || "",
              client_name: data.client_name
            }
          }
        );
        
        if (assistantError) {
          console.error("Failed to create OpenAI assistant:", assistantError);
        } else {
          console.log("OpenAI assistant created:", assistantResult);
        }
      } catch (assistantErr) {
        console.error("Error creating OpenAI assistant:", assistantErr);
        // Continue even if assistant creation fails
      }
      
      // Force refresh of client list
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      navigate("/admin/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Failed to create client");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Register New AI Agent</h1>
      
      <div className="mb-4">
        <TestEmailComponent />
      </div>
      
      <ClientRegistrationForm onSubmit={handleSubmit} />
    </div>
  );
}
