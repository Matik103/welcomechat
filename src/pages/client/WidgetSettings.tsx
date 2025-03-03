
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { WidgetSettings as IWidgetSettings, defaultSettings, isWidgetSettings } from "@/types/widget-settings";
import { BrandingSettings } from "@/components/widget/BrandingSettings";
import { AppearanceSettings } from "@/components/widget/AppearanceSettings";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { EmbedCode } from "@/components/widget/EmbedCode";

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

const ClientWidgetSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch client info first to get the ID
  const { data: clientInfo, isLoading: isLoadingClient } = useQuery({
    queryKey: ["clientInfo", user?.email],
    queryFn: async () => {
      if (!user?.email) throw new Error("User email not found");
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (clientInfo) {
      setClientId(clientInfo.id);
      
      const widgetSettings = clientInfo.widget_settings;
      if (isWidgetSettings(widgetSettings)) {
        setSettings(widgetSettings);
      } else {
        setSettings({
          ...defaultSettings,
          agent_name: clientInfo.agent_name || ""
        });
      }
    }
  }, [clientInfo]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      if (!clientId) throw new Error("Client ID not found");
      
      const { error } = await supabase
        .from("clients")
        .update({
          widget_settings: convertSettingsToJson(newSettings)
        })
        .eq("id", clientId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved successfully! 🎉",
        description: "Your widget is ready to be embedded.",
      });
    },
    onError: (error) => {
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

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      const newSettings = { ...settings, logo_url: publicUrl };
      setSettings(newSettings);
      await updateSettingsMutation.mutateAsync(newSettings);

      toast({
        title: "Logo uploaded successfully! ✨",
        description: "Your brand is looking great!",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSettingsChange = (newSettings: Partial<IWidgetSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync(settings);
  };

  if (isLoadingClient || !clientInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Widget Settings</h1>
          <p className="text-gray-500">Customize how your chat widget looks and behaves on your website</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Configure your widget's appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingSettings
                settings={settings}
                isUploading={isUploading}
                onSettingsChange={handleSettingsChange}
                onLogoUpload={handleLogoUpload}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your widget</CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Copy this code to add the widget to your website</CardDescription>
            </CardHeader>
            <CardContent>
              <EmbedCode settings={settings} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>See how your widget will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetPreview
                settings={settings}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(!showPreview)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={updateSettingsMutation.isPending || isUploading}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientWidgetSettings;
