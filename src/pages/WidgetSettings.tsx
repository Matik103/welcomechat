
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { WidgetSettings as IWidgetSettings, defaultSettings, isWidgetSettings } from "@/types/widget-settings";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { toast } from "sonner";

function convertSettingsToJson(settings: IWidgetSettings): { [key: string]: Json } {
  // Ensure all fields are properly defined
  return {
    agent_name: settings.agent_name || defaultSettings.agent_name,
    logo_url: settings.logo_url || '',
    webhook_url: settings.webhook_url || '',
    chat_color: settings.chat_color || defaultSettings.chat_color,
    background_color: settings.background_color || defaultSettings.background_color,
    text_color: settings.text_color || defaultSettings.text_color,
    secondary_color: settings.secondary_color || defaultSettings.secondary_color,
    position: settings.position || defaultSettings.position,
    welcome_text: settings.welcome_text || defaultSettings.welcome_text,
    response_time_text: settings.response_time_text || defaultSettings.response_time_text
  };
}

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast(); // Renamed to avoid conflicts with sonner toast
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);

  const isClientView = !id;
  const clientId = id || user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);

  console.log("Client ID for widget settings:", clientId);

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
      
      const settingsJson = convertSettingsToJson(newSettings);
      console.log("Settings being saved to DB:", settingsJson);
      
      const { error, data } = await supabase
        .from("clients")
        .update({
          widget_settings: settingsJson
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
      
      // Using the UI toast from shadcn/ui
      uiToast({
        title: "Settings saved successfully! 🎉",
        description: "Your widget is ready to be embedded.",
      });
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      uiToast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clientId) {
      console.log("No file or clientId available:", { file: !!file, clientId });
      return;
    }

    try {
      setIsUploading(true);
      console.log("Starting logo upload process...");
      
      // Prepare file name with extension
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${clientId}/${crypto.randomUUID()}.${fileExt}`;
      console.log("Prepared file name for upload:", fileName);

      // Use the existing "widget-logos" bucket
      const BUCKET_NAME = "widget-logos";
      
      // Attempt to upload the file
      console.log(`Uploading logo to ${BUCKET_NAME} storage...`);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Logo uploaded successfully:", uploadData);

      // Get the public URL with complete URL path
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log("Logo public URL generated:", publicUrl);

      if (!publicUrl) {
        throw new Error("Failed to generate public URL for uploaded logo");
      }

      // Ensure the URL is properly formatted
      const fullPublicUrl = publicUrl.startsWith('http') 
        ? publicUrl 
        : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
      
      console.log("Full public URL for logo:", fullPublicUrl);

      // Update the settings with the new logo URL
      const newSettings = { 
        ...settings, 
        logo_url: fullPublicUrl 
      };
      
      console.log("Updating settings with logo URL:", fullPublicUrl);
      setSettings(newSettings);
      
      // Save the new settings immediately
      console.log("Saving settings with new logo URL...");
      await updateSettingsMutation.mutateAsync(newSettings);

      if (isClientView) {
        await logClientActivity(
          "logo_uploaded", 
          "uploaded a new logo for their widget", 
          { logo_url: fullPublicUrl }
        );
      }

      toast.success("Logo uploaded successfully! ✨");
    } catch (error: any) {
      console.error("Logo upload process failed:", error);
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

  // Create a wrapper object that adapts the mutation to the expected interface
  const adaptedMutation = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: async (newSettings: IWidgetSettings): Promise<void> => {
      await updateSettingsMutation.mutateAsync(newSettings);
      // Return void to match the expected type
      return;
    }
  };

  return (
    <WidgetSettingsContainer
      settings={settings}
      isClientView={isClientView}
      isUploading={isUploading}
      updateSettingsMutation={adaptedMutation}
      handleBack={handleBack}
      handleLogoUpload={handleLogoUpload}
      logClientActivity={logClientActivity}
    />
  );
};

export default WidgetSettings;
