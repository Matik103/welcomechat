
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { WidgetSettings as IWidgetSettings, defaultSettings, isWidgetSettings } from "@/types/widget-settings";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { toast } from "sonner";

function convertSettingsToJson(settings: IWidgetSettings): { [key: string]: Json } {
  return {
    agent_name: settings.agent_name,
    logo_url: settings.logo_url,
    webhook_url: settings.webhook_url,
    chat_color: settings.chat_color,
    background_color: settings.background_color,
    text_color: settings.text_color,
    secondary_color: settings.secondary_color,
    position: settings.position,
    welcome_text: settings.welcome_text,
    response_time_text: settings.response_time_text
  };
}

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);

  const isClientView = !id;
  const clientId = id || user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      console.log("Fetching client data for ID:", clientId);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (error) {
        console.error("Error fetching client:", error);
        throw error;
      }
      
      console.log("Client data fetched:", data);
      return data;
    },
    enabled: !!clientId,
    staleTime: 0 // Always refetch to get latest data
  });

  useEffect(() => {
    if (client) {
      console.log("Client data:", client);
      console.log("Widget settings from client:", client.widget_settings);
      
      if (client.widget_settings && isWidgetSettings(client.widget_settings)) {
        console.log("Valid widget settings detected, applying to state");
        setSettings(client.widget_settings as IWidgetSettings);
      } else {
        console.log("Invalid or missing widget settings, using defaults with agent name");
        setSettings({
          ...defaultSettings,
          agent_name: client.agent_name || ""
        });
      }
    }
  }, [client]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      console.log("Saving widget settings:", newSettings);
      
      if (!clientId) {
        throw new Error("No client ID available");
      }
      
      const { error, data } = await supabase
        .from("clients")
        .update({
          widget_settings: convertSettingsToJson(newSettings)
        })
        .eq("id", clientId)
        .select();
      
      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      // Invalidate the client query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      
      return data;
    },
    onSuccess: () => {
      if (isClientView) {
        logClientActivity(
          "widget_settings_updated", 
          "updated widget settings", 
          { 
            updated_fields: Object.keys(settings).filter(key => 
              client?.widget_settings && 
              settings[key as keyof IWidgetSettings] !== client.widget_settings[key]
            ) 
          }
        );
      }
      
      toast({
        title: "Settings saved successfully! 🎉",
        description: "Your widget is ready to be embedded.",
      });
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clientId) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      console.log("Uploading logo:", { fileName, filePath });

      // Create a logos bucket if it doesn't exist
      const { data: bucketExists } = await supabase.storage.getBucket('logos');
      if (!bucketExists) {
        console.log("Creating logos bucket");
        await supabase.storage.createBucket('logos', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
      }

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        throw uploadError;
      }

      console.log("Logo uploaded successfully:", uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      console.log("Logo public URL generated:", publicUrl);

      // Update the settings with the new logo URL
      const newSettings = { 
        ...settings, 
        logo_url: publicUrl 
      };
      
      setSettings(newSettings);
      
      // Save the new settings immediately when the logo is uploaded
      await updateSettingsMutation.mutateAsync(newSettings);

      if (isClientView) {
        await logClientActivity(
          "logo_uploaded", 
          "uploaded a new logo for their widget", 
          { logo_url: publicUrl }
        );
      }

      toast.success("Logo uploaded successfully! ✨");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    if (isClientView) {
      navigate('/client/view');
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <WidgetSettingsContainer
      settings={settings}
      isClientView={isClientView}
      isUploading={isUploading}
      updateSettingsMutation={updateSettingsMutation}
      handleBack={handleBack}
      handleLogoUpload={handleLogoUpload}
      logClientActivity={logClientActivity}
    />
  );
};

export default WidgetSettings;
