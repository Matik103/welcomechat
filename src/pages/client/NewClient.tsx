
import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TestEmailComponent } from "@/components/client/TestEmailComponent";
import { generateTempPassword } from "@/utils/clientCreationUtils";

export default function NewClient() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
      
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
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
      
      console.log("Client created successfully with ID:", clientData.id);
      
      // Store the temporary password in the database
      const { error: passwordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: clientData.id,
          email: data.email,
          temp_password: tempPassword
        });
        
      if (passwordError) {
        console.error("Error saving temporary password:", passwordError);
        toast.error(`Client created but failed to save credentials: ${passwordError.message}`, {
          id: loadingToastId,
          duration: 6000
        });
        return;
      }
      
      console.log("Temporary password saved successfully, now sending welcome email");
      
      // Call the send-welcome-email edge function
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
      
      console.log("Email function response:", emailResult, "Error:", emailError);
      
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
      
      console.log("Client created successfully:", clientData);
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
