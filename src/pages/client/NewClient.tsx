import { useNavigate } from "react-router-dom";
import { ClientRegistrationForm } from "@/components/forms/ClientRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function NewClient() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
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
            toast.error("Please sign in to upload files");
          } else {
            toast.error("Failed to upload logo");
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
          name: data.bot_settings.bot_name,
          agent_description: data.bot_settings.bot_personality,
          logo_url: logo_url,
          status: 'active',
          content: '',
          interaction_type: 'config',
          settings: {
            client_name: data.client_name,
            email: data.email,
            bot_name: data.bot_settings.bot_name,
            bot_personality: data.bot_settings.bot_personality,
            logo_url: logo_url
          }
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating AI agent:", error);
        toast.error("Failed to create AI agent");
        return;
      }

      // Log the activity
      const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
          activity_type: 'ai_agent_created',
          description: `Created new AI agent: ${data.bot_settings.bot_name}`,
          metadata: {
            client_name: data.client_name,
            email: data.email,
            bot_name: data.bot_settings.bot_name,
            logo_url: logo_url
          }
        });

      if (activityError) {
        console.error("Error logging activity:", activityError);
        // Don't show error to user as the main operation succeeded
      }

      console.log("AI agent created successfully:", agentData);
      toast.success("AI agent created successfully!");
      navigate("/admin/clients");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to create AI agent");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Register New AI Agent</h1>
      <ClientRegistrationForm onSubmit={handleSubmit} />
    </div>
  );
} 