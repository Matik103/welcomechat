import { useState } from "react";
import { useClientData } from "@/hooks/useClientData";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/client/settings/ProfileSection";
import { WidgetSection } from "@/components/client/settings/WidgetSection";
import { defaultSettings } from "@/types/widget-settings";

const ClientSettings = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { client, isLoadingClient, clientMutation } = useClientData(user?.id);

  const handleSettingsChange = (newSettings: any) => {
    if (!client) return;
    clientMutation.mutate({
      ...client,
      widget_settings: {
        ...client.widget_settings ?? defaultSettings,
        ...newSettings,
      },
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    setIsUploading(true);
    try {
      // Logo upload logic will be implemented here
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading logo:', error);
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
          <ProfileSection client={client} clientMutation={clientMutation} />
        </TabsContent>

        <TabsContent value="widget" className="space-y-6">
          <WidgetSection
            settings={client.widget_settings ?? defaultSettings}
            isUploading={isUploading}
            onSettingsChange={handleSettingsChange}
            onLogoUpload={handleLogoUpload}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientSettings;
