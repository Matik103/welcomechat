
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSection } from "@/components/client/settings/ProfileSection";
import { WidgetSection } from "@/components/client/settings/WidgetSection";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useClientData } from "@/hooks/useClientData";
import { defaultSettings } from "@/types/widget-settings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

const ClientSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { logClientActivity } = useClientActivity(clientId);
  const { client, clientMutation, isLoadingClient } = useClientData(clientId);
  const [isUploading, setIsUploading] = useState(false);
  
  // Log settings page visit
  useEffect(() => {
    if (clientId) {
      logClientActivity(
        "settings_viewed", 
        "viewed their settings page", 
        { timestamp: new Date().toISOString() }
      );
    }
  }, [clientId, logClientActivity]);

  const handleSettingsChange = async (newSettings: Partial<typeof defaultSettings>) => {
    if (!client) return;

    try {
      const updatedSettings = { 
        ...(client.widget_settings as Json || {}), 
        ...newSettings 
      };
      
      await supabase
        .from("clients")
        .update({ widget_settings: updatedSettings })
        .eq("id", clientId);

      toast.success("Widget settings updated successfully");
      
      // Log the settings update activity
      logClientActivity(
        "widget_settings_updated",
        "updated their widget settings",
        { settings_changed: Object.keys(newSettings) }
      );
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !client) {
      return;
    }

    try {
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${clientId}/logo.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('widget-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('widget-assets')
        .getPublicUrl(filePath);

      // Update widget settings with the new logo URL
      await handleSettingsChange({ logo_url: data.publicUrl });
      
      // Log the logo upload activity
      logClientActivity(
        "logo_uploaded",
        "uploaded a new logo for their chatbot",
        { logo_url: data.publicUrl }
      );

      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account and widget settings</p>
        </div>

        <div className="space-y-6">
          {client && (
            <>
              <ProfileSection 
                client={client} 
                clientMutation={clientMutation} 
              />
              <WidgetSection 
                settings={client.widget_settings as typeof defaultSettings || defaultSettings}
                isUploading={isUploading}
                onSettingsChange={handleSettingsChange}
                onLogoUpload={handleLogoUpload}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
