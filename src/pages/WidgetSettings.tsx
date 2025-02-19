
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Copy, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WidgetSettings {
  agent_name: string;
  logo_url: string;
  webhook_url: string;
  chat_color: string;
  background_color: string;
  text_color: string;
}

const WidgetSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<WidgetSettings>({
    agent_name: "",
    logo_url: "",
    webhook_url: "",
    chat_color: "#854fff",
    background_color: "#ffffff",
    text_color: "#333333"
  });

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

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WidgetSettings) => {
      const { error } = await supabase
        .from("clients")
        .update({
          widget_settings: newSettings,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Widget settings have been updated successfully.",
      });
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/logo.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast({
        title: "Logo uploaded",
        description: "Company logo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo.",
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
      title: "Code copied",
      description: "Widget embed code has been copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/clients"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Widget Settings - {client?.client_name}
            </h1>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Company logo"
                      className="h-10 w-auto object-contain"
                    />
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
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
                  placeholder="Enter webhook URL"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chat_color">Chat Window Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="chat_color"
                      value={settings.chat_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, chat_color: e.target.value }))
                      }
                      className="w-full h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
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
                      className="w-full h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="text_color"
                      value={settings.text_color}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, text_color: e.target.value }))
                      }
                      className="w-full h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-4 space-y-4"
                style={{
                  backgroundColor: settings.background_color,
                  color: settings.text_color,
                }}
              >
                <div className="flex items-center gap-2">
                  {settings.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <span className="font-medium">{settings.agent_name || "AI Agent"}</span>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: settings.chat_color, color: "#ffffff" }}
                >
                  Hi 👋, how can we help?
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full h-48 p-4 font-mono text-sm bg-gray-50 rounded-lg border"
                value={generateEmbedCode()}
                readOnly
              />
              <Button onClick={copyEmbedCode} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy Embed Code
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/clients")}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateSettingsMutation.mutate(settings)}
              disabled={updateSettingsMutation.isPending}
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
