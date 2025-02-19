
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Copy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface WidgetSettings {
  agent_name: string;
  logo_url: string;
  webhook_url: string;
  chat_color: string;
  background_color: string;
  text_color: string;
}

const defaultSettings: WidgetSettings = {
  agent_name: "",
  logo_url: "",
  webhook_url: "",
  chat_color: "#854fff",
  background_color: "#ffffff",
  text_color: "#333333"
};

function isWidgetSettings(value: unknown): value is WidgetSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  return typeof settings.agent_name === 'string' &&
         typeof settings.logo_url === 'string' &&
         typeof settings.webhook_url === 'string' &&
         typeof settings.chat_color === 'string' &&
         typeof settings.background_color === 'string' &&
         typeof settings.text_color === 'string';
}

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
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

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      const { error } = await supabase
        .from("clients")
        .update({
          widget_settings: newSettings
        })
        .eq("id", id);
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
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

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

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync(settings);
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
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
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agent_name">Agent Name</Label>
              <Input
                id="agent_name"
                value={settings.agent_name}
                onChange={(e) => setSettings({ ...settings, agent_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="mt-1 flex items-center gap-4">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="h-12 w-12 object-contain rounded border border-gray-200"
                  />
                )}
                <Button 
                  variant="outline" 
                  className="relative"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={settings.webhook_url}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                placeholder="https://your-webhook-url.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="chat_color">Chat Color</Label>
                <Input
                  id="chat_color"
                  type="color"
                  value={settings.chat_color}
                  onChange={(e) => setSettings({ ...settings, chat_color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <Input
                  id="text_color"
                  type="color"
                  value={settings.text_color}
                  onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                />
              </div>
            </div>
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
