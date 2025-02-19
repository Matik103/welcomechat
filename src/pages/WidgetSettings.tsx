import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Copy, Code, Monitor, Upload } from "lucide-react";
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
  secondary_color: string;
  position: 'left' | 'right';
  welcome_text: string;
  response_time_text: string;
}

const defaultSettings: WidgetSettings = {
  agent_name: "",
  logo_url: "",
  webhook_url: "",
  chat_color: "#854fff",
  secondary_color: "#6b3fd4",
  background_color: "#ffffff",
  text_color: "#333333",
  position: "right",
  welcome_text: "Hi 👋, how can I help?",
  response_time_text: "I typically respond right away"
};

function isWidgetSettings(value: unknown): value is WidgetSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  return typeof settings.agent_name === 'string' &&
         typeof settings.logo_url === 'string' &&
         typeof settings.webhook_url === 'string' &&
         typeof settings.chat_color === 'string' &&
         typeof settings.background_color === 'string' &&
         typeof settings.text_color === 'string' &&
         typeof settings.secondary_color === 'string' &&
         (settings.position === 'left' || settings.position === 'right') &&
         typeof settings.welcome_text === 'string' &&
         typeof settings.response_time_text === 'string';
}

function convertSettingsToJson(settings: WidgetSettings): { [key: string]: Json } {
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
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(true);

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
          widget_settings: convertSettingsToJson(newSettings)
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

  const handleCopyCode = () => {
    const embedCode = `<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        webhook: {
            url: '${settings.webhook_url}',
            route: 'general'
        },
        branding: {
            logo: '${settings.logo_url}',
            name: '${settings.agent_name}',
            welcomeText: '${settings.welcome_text}',
            responseTimeText: '${settings.response_time_text}'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.secondary_color}',
            position: '${settings.position}',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}'
        }
    };
</script>
<script src="https://cdn.jsdelivr.net/gh/WayneSimpson/n8n-chatbot-template@ba944c3/chat-widget.js"></script>
<!-- Widget Script -->`;

    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Code copied! 📋",
      description: "The widget code has been copied to your clipboard.",
    });
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
              <Label htmlFor="webhook_url">N8N Webhook URL</Label>
              <Input
                id="webhook_url"
                value={settings.webhook_url}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                placeholder="https://your-n8n-webhook-url.com"
              />
            </div>

            <div>
              <Label htmlFor="welcome_text">Welcome Message</Label>
              <Input
                id="welcome_text"
                value={settings.welcome_text}
                onChange={(e) => setSettings({ ...settings, welcome_text: e.target.value })}
                placeholder="Hi 👋, how can I help?"
              />
            </div>

            <div>
              <Label htmlFor="response_time_text">Response Time Message</Label>
              <Input
                id="response_time_text"
                value={settings.response_time_text}
                onChange={(e) => setSettings({ ...settings, response_time_text: e.target.value })}
                placeholder="I typically respond right away"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chat_color">Primary Color</Label>
                <Input
                  id="chat_color"
                  type="color"
                  value={settings.chat_color}
                  onChange={(e) => setSettings({ ...settings, chat_color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="position">Widget Position</Label>
                <select
                  id="position"
                  value={settings.position}
                  onChange={(e) => setSettings({ ...settings, position: e.target.value as 'left' | 'right' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>Copy this code to add the widget to your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                {`<script>
  window.CHATBOT_CONFIG = {
    clientId: "${id}",
    settings: ${JSON.stringify(settings, null, 2)}
  };
</script>
<script src="https://cdn.example.com/widget.js" async></script>`}
              </pre>
              <Button
                size="sm"
                onClick={handleCopyCode}
                className="absolute top-2 right-2"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>See how your widget will appear</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Monitor className="w-4 h-4 mr-2" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </CardHeader>
          <CardContent>
            {showPreview && (
              <div className="border rounded-lg h-[500px] relative">
                <div className="absolute bottom-4 right-4 w-96 h-[450px] border rounded-lg shadow-lg bg-white">
                  <div
                    className="h-12 flex items-center px-4 rounded-t-lg"
                    style={{ backgroundColor: settings.chat_color }}
                  >
                    <div className="flex items-center gap-3">
                      {settings.logo_url && (
                        <img
                          src={settings.logo_url}
                          alt="Agent logo"
                          className="w-8 h-8 rounded object-contain bg-white"
                        />
                      )}
                      <span className="font-medium text-white">
                        {settings.agent_name || "AI Agent"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex-1 p-4 overflow-y-auto"
                    style={{
                      backgroundColor: settings.background_color,
                      color: settings.text_color,
                    }}
                  >
                    <div className="text-center text-sm opacity-50 my-8">
                      This is a preview of how your widget will look
                    </div>
                  </div>
                </div>
              </div>
            )}
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
