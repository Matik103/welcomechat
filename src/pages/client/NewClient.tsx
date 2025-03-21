
import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createOpenAIAssistant } from "@/utils/openAIUtils";
import { TestEmailComponent } from "@/components/client/TestEmailComponent";
import { Loader2 } from "lucide-react";

export default function NewClient() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    // Show loading toast
    const loadingToastId = toast.loading("Creating AI agent and sending welcome email...");
    
    try {
      let logo_url = null;

      // Handle logo upload if present
      if (data.bot_settings?.bot_logo) {
        const file = data.bot_settings.bot_logo;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Upload the file
        const { error: uploadError } = await supabase.storage
          .from('bot-logos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type // Add content type
          });

        if (uploadError) {
          console.error("Error uploading logo:", uploadError);
          if (uploadError.message.includes('Unauthorized')) {
            toast.error("Please sign in to upload files", { id: loadingToastId });
          } else {
            toast.error("Failed to upload logo", { id: loadingToastId });
          }
          return;
        }

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('bot-logos')
          .getPublicUrl(filePath);

        logo_url = publicUrl;
      }

      // Create AI agent with all information
      const { data: agentData, error } = await supabase
        .from("ai_agents")
        .insert({
          name: data.bot_settings.bot_name || "AI Assistant",
          agent_description: data.bot_settings.bot_personality,
          logo_url: logo_url,
          status: 'active',
          content: '',
          interaction_type: 'config',
          client_name: data.client_name, // Save client name in ai_agents table
          email: data.email, // Save email in ai_agents table
          settings: {
            client_name: data.client_name,
            email: data.email,
            bot_name: data.bot_settings.bot_name || "AI Assistant",
            bot_personality: data.bot_settings.bot_personality,
            logo_url: logo_url
          }
        })
        .select("id, client_id")
        .single();

      if (error) {
        console.error("Error creating AI agent:", error);
        toast.error("Failed to create AI agent", { id: loadingToastId });
        return;
      }

      // Create OpenAI assistant for the new agent
      try {
        await createOpenAIAssistant(
          agentData.client_id,
          data.bot_settings.bot_name || "AI Assistant",
          data.bot_settings.bot_personality || "",
          data.client_name
        );
      } catch (openaiError) {
        console.error("Error creating OpenAI assistant:", openaiError);
        // We continue even if OpenAI assistant creation fails
      }

      // Log the activity
      const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
          activity_type: 'client_created',
          description: `Created new AI agent: ${data.bot_settings.bot_name || "AI Assistant"}`,
          metadata: {
            client_name: data.client_name,
            email: data.email,
            bot_name: data.bot_settings.bot_name || "AI Assistant",
            logo_url: logo_url
          }
        });

      if (activityError) {
        console.error("Error logging activity:", activityError);
        // Don't show error to user as the main operation succeeded
      }
      
      // Generate a temporary password for the client
      const tempPassword = (() => {
        // Generate a password in the format "Welcome2025#123"
        const currentYear = new Date().getFullYear();
        const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
        return `Welcome${currentYear}#${randomDigits}`;
      })();
      
      // Store temp password in the database
      const { error: tempPasswordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: agentData.id,
          email: data.email,
          temp_password: tempPassword
        });

      if (tempPasswordError) {
        console.error("Error saving temporary password:", tempPasswordError);
        toast.error("Failed to create login credentials", { id: loadingToastId });
        return;
      }
      
      // Show sending email toast
      toast.loading("Sending welcome email...", { id: loadingToastId });
      
      // Send welcome email using the send-welcome-email edge function
      try {
        // Call the edge function directly
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            clientId: agentData.client_id,
            clientName: data.client_name,
            email: data.email,
            agentName: data.bot_settings.bot_name || "AI Assistant",
            tempPassword: tempPassword
          }
        });
        
        if (emailError) {
          console.error("Email sending error:", emailError);
          
          // Log the failed email attempt with a valid activity type
          await supabase.from("client_activities").insert({
            activity_type: "client_updated",
            description: `Failed to send welcome email to client ${data.client_name}`,
            metadata: { 
              error: emailError.message,
              action: "welcome_email_failed",
              client_name: data.client_name,
              admin_action: true
            }
          });
          
          toast.error(`Client created successfully but welcome email failed to send: ${emailError.message}`, {
            id: loadingToastId,
            duration: 6000
          });
        } else if (emailData && !emailData.success) {
          console.error("Email function returned error:", emailData);
          
          toast.error(`Client created successfully but welcome email failed to send: ${emailData.error || "Unknown error"}`, {
            id: loadingToastId,
            duration: 6000
          });
        } else {
          // Success - log the activity
          await supabase.from("client_activities").insert({
            activity_type: "client_updated",
            description: `Welcome email sent to ${data.client_name}`,
            metadata: { 
              recipient_email: data.email,
              email_type: "welcome_email",
              client_name: data.client_name,
              admin_action: true,
              successful: true
            }
          });
          
          toast.success(`Client created successfully and welcome email sent to ${data.email}`, {
            id: loadingToastId
          });
        }
      } catch (emailErr: any) {
        console.error("Error sending email:", emailErr);
        toast.error(`Client created successfully but welcome email failed to send: ${emailErr.message || "Unknown error"}`, {
          id: loadingToastId,
          duration: 6000
        });
      }

      console.log("AI agent created successfully:", agentData);
      navigate("/admin/clients");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to create AI agent", { id: loadingToastId });
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
