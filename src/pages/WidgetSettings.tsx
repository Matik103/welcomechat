
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

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
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);

  const isClientView = !id;
  
  const clientId = id || user?.user_metadata?.client_id;

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  useEffect(() => {
    if (client) {
      const widgetSettings = client.widget_settings;
      if (isWidgetSettings(widgetSettings)) {
        setSettings(widgetSettings);
      } else {
        setSettings({
          ...defaultSettings,
          agent_name: client.agent_name || ""
        });
      }
    }
  }, [client]);

  const logClientActivity = async (activity_type: string, description: string, metadata = {}) => {
    if (!clientId) return;
    
    try {
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type,
        description,
        metadata
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      const { error } = await supabase
        .from("clients")
        .update({
          widget_settings: convertSettingsToJson(newSettings)
        })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Log widget settings update activity
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
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      // Log logo upload activity
      if (isClientView) {
        await logClientActivity(
          "logo_uploaded", 
          "uploaded a new logo for their widget", 
          { logo_url: publicUrl }
        );
      }

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

  const handleBack = () => {
    if (isClientView) {
      navigate('/client/view');
    } else {
      navigate(-1);
    }
  };

  const handleCopyEmbedCode = () => {
    if (isClientView) {
      logClientActivity(
        "embed_code_copied", 
        "copied the widget embed code",
        {}
      );
    }
  };

  const handleTogglePreview = (isVisible: boolean) => {
    setShowPreview(isVisible);
    
    if (isClientView) {
      logClientActivity(
        "widget_previewed", 
        isVisible ? "previewed their widget" : "closed the widget preview",
        {}
      );
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Widget Settings</h1>
        <p className="text-gray-500">Customize how your chat widget looks and behaves</p>
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
            <EmbedCode 
              settings={settings} 
              onCopy={handleCopyEmbedCode}
            />
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
              onTogglePreview={handleTogglePreview}
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
  );
};

export default WidgetSettings;
