import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AppearanceSettings } from "@/components/widget/AppearanceSettings";
import { BrandingSettings } from "@/components/widget/BrandingSettings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";

const ClientSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { client, isLoadingClient, clientMutation } = useClientData(user?.id);
  const { toast } = useToast();

  const handleSettingsChange = (newSettings: Partial<WidgetSettings>) => {
    if (!client) return;
    clientMutation.mutate({
      ...client,
      widget_settings: {
        ...client.widget_settings,
        ...newSettings,
      },
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

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

      const newSettings = { ...client.widget_settings, logo_url: publicUrl };
      handleSettingsChange(newSettings);

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

  if (isLoadingClient) {
    return <div>Loading...</div>;
  }

  if (!client) {
    return <div>No client data found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account and widget settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <ClientForm
              initialData={client}
              onSubmit={(data) => clientMutation.mutate(data)}
              isLoading={clientMutation.isPending}
            />
          </Card>
        </TabsContent>

        <TabsContent value="widget" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Branding</h2>
            <BrandingSettings
              settings={client.widget_settings}
              isUploading={isUploading}
              onSettingsChange={handleSettingsChange}
              onLogoUpload={handleLogoUpload}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Appearance</h2>
            <AppearanceSettings
              settings={client.widget_settings}
              onSettingsChange={handleSettingsChange}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface BrandingSettingsProps {
  settings: any;
  isUploading: boolean;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function BrandingSettings({
  settings,
  isUploading,
  onSettingsChange,
  onLogoUpload
}: BrandingSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agent_name">Agent Name</Label>
        <Input
          id="agent_name"
          value={settings?.agent_name || ""}
          onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="logo">Logo</Label>
        <div className="mt-1 flex items-center gap-4">
          {settings?.logo_url && (
            <img 
              src={settings?.logo_url} 
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
              onChange={onLogoUpload}
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
          value={settings?.webhook_url || ""}
          onChange={(e) => onSettingsChange({ webhook_url: e.target.value })}
          placeholder="https://your-n8n-webhook-url.com"
        />
      </div>

      <div>
        <Label htmlFor="welcome_text">Welcome Message</Label>
        <Input
          id="welcome_text"
          value={settings?.welcome_text || ""}
          onChange={(e) => onSettingsChange({ welcome_text: e.target.value })}
          placeholder="Hi 👋, how can I help?"
        />
      </div>

      <div>
        <Label htmlFor="response_time_text">Response Time Message</Label>
        <Input
          id="response_time_text"
          value={settings?.response_time_text || ""}
          onChange={(e) => onSettingsChange({ response_time_text: e.target.value })}
          placeholder="I typically respond right away"
        />
      </div>
    </div>
  );
}

export default ClientSettings;
