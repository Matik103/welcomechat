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
        setSettings({
          agent_name: widgetSettings.agent_name,
          logo_url: widgetSettings.logo_url,
          webhook_url: widgetSettings.webhook_url,
          chat_color: widgetSettings.chat_color,
          background_color: widgetSettings.background_color,
          text_color: widgetSettings.text_color
        });
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
      const settingsAsJson: Json = {
        agent_name: newSettings.agent_name,
        logo_url: newSettings.logo_url,
        webhook_url: newSettings.webhook_url,
        chat_color: newSettings.chat_color,
        background_color: newSettings.background_color,
        text_color: newSettings.text_color
      };

      const { error } = await supabase
        .from("clients")
        .update({
          widget_settings: settingsAsJson
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
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast({
        title: "Logo uploaded successfully! ✨",
        description: "Your brand is looking great!",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateEmbedCode = () => {
    return `<!-- Widget Configuration -->
<script>
    window.ChatWidgetConfig = {
        webhook: {
            url: '${settings.webhook_url}',
            route: 'general'
        },
        branding: {
            logo: '${settings.logo_url}',
            name: '${settings.agent_name}',
            welcomeText: 'Hi 👋, how can we help?',
            responseTimeText: 'We typically respond right away'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.chat_color}',
            position: 'right',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}'
        }
    };
</script>
<script src="https://cdn.jsdelivr.net/gh/WayneSimpson/n8n-chatbot-template@ba944c3/chat-widget.js"></script>
<!-- Widget Script -->`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast({
      title: "Code copied! 📋",
      description: "Ready to be pasted into your website.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading your widget settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              to="/clients"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Widget Settings
              </h1>
              <p className="text-gray-500">Customize your AI chat widget for {client?.client_name}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
              <CardDescription>Personalize your chat widget's appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent_name">AI Agent Name</Label>
                <Input
                  id="agent_name"
                  value={settings.agent_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, agent_name: e.target.value }))
                  }
                  placeholder="Enter AI Agent name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                    {settings.logo_url ? (
                      <img
                        src={settings.logo_url}
                        alt="Company logo"
                        className="max-h-14 w-auto object-contain"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <Button variant="outline" className="flex-1" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {settings.logo_url ? "Change Logo" : "Upload Logo"}
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook">n8n Webhook URL</Label>
                <Input
                  id="webhook"
                  value={settings.webhook_url}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, webhook_url: e.target.value }))
                  }
                  placeholder="Enter your n8n webhook URL"
                  className="font-mono text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="chat_color">Chat Window Color</Label>
                  <div className="relative">
                    <Input
                      type="color"
                      id="chat_color"
                      value={settings.chat_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, chat_color: e.target.value }))
                      }
                      className="w-full h-10 cursor-pointer"
                    />
                    <div className="mt-2 text-xs text-gray-500">{settings.chat_color}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="relative">
                    <Input
                      type="color"
                      id="background_color"
                      value={settings.background_color}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          background_color: e.target.value,
                        }))
                      }
                      className="w-full h-10 cursor-pointer"
                    />
                    <div className="mt-2 text-xs text-gray-500">{settings.background_color}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="relative">
                    <Input
                      type="color"
                      id="text_color"
                      value={settings.text_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, text_color: e.target.value }))
                      }
                      className="w-full h-10 cursor-pointer"
                    />
                    <div className="mt-2 text-xs text-gray-500">{settings.text_color}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your chat widget will appear on your website</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-white/50 backdrop-blur-sm -m-6 z-0" />
              <div className="relative z-10">
                <div
                  className="border rounded-lg p-6 space-y-4 shadow-lg transform transition-all duration-200"
                  style={{
                    backgroundColor: settings.background_color,
                    color: settings.text_color,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {settings.logo_url && (
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        className="h-10 w-10 object-contain rounded"
                      />
                    )}
                    <span className="font-medium text-lg">
                      {settings.agent_name || "AI Agent"}
                    </span>
                  </div>
                  <div
                    className="rounded-lg p-4 transform transition-all duration-200"
                    style={{ backgroundColor: settings.chat_color, color: "#ffffff" }}
                  >
                    Hi 👋, how can we help?
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Copy this code and paste it into your website's HTML</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full h-48 p-4 font-mono text-sm bg-gray-50 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all duration-200"
                  value={generateEmbedCode()}
                  readOnly
                />
                <Button 
                  onClick={copyEmbedCode}
                  className="absolute top-2 right-2"
                  variant="secondary"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/clients")}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateSettingsMutation.mutate(settings)}
              disabled={updateSettingsMutation.isPending}
              className="min-w-[100px]"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;
