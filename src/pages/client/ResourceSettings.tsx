
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ClientDetails } from "@/components/client/ClientDetails";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";

const ResourceSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error } = useClientData(clientId);
  const { logClientActivity } = useClientActivity(clientId);

  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700">Error loading client data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SettingsHeader />
      
      <Card className="mb-8 mt-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Resource Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Manage your Google Drive links and website URLs that your AI agent can use to retrieve information.
          </p>
          
          <div className="space-y-8">            
            <ClientResourceSections
              clientId={clientId}
              isClientView={true}
              logClientActivity={logClientActivity}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceSettings;
