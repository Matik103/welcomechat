import { useState, useEffect } from "react";
import { WidgetSettingsContainer } from "@/components/widget/WidgetSettingsContainer";
import { useParams, useNavigate } from "react-router-dom";
import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useClientActivity } from "@/hooks/useClientActivity";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getWidgetSettings, updateWidgetSettings } from "@/services/widgetSettingsService";
import { handleLogoUpload } from "@/services/uploadService";
import { WidgetSettings as IWidgetSettings } from "@/types/widget-settings";
import { toast } from "sonner";
import { defaultSettings } from "@/types/widget-settings";

export default function WidgetSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { logClientActivity } = useClientActivity(clientId);
  const widgetSettingsHook = useWidgetSettings(clientId || "");

  // Fetch widget settings
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["widget-settings", clientId],
    queryFn: () => clientId ? getWidgetSettings(clientId) : Promise.resolve(defaultSettings),
    enabled: !!clientId,
  });

  // Update widget settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings): Promise<void> => {
      if (clientId) {
        await updateWidgetSettings(clientId, newSettings);
        // Log the activity
        await logClientActivity("client_updated", "Widget settings updated");
      }
    },
    onSuccess: () => {
      refetch();
      if (isAdmin) {
        toast.success("Widget settings updated successfully");
      } else {
        toast.success("Your AI assistant settings have been updated");
      }
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleNavigateBack = () => {
    if (isAdmin) {
      navigate(`/admin/clients/${clientId}`);
    } else {
      navigate("/client/dashboard");
    }
  };

  const handleLogoUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!clientId) return;
    
    setIsUploading(true);
    try {
      const result = await handleLogoUpload(event, clientId);
      
      if (result) {
        await widgetSettingsHook.updateLogo(result.url, result.path);
        await logClientActivity();
        refetch();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading widget settings...</div>;
  }

  // Create a wrapper for updateSettingsMutation to match expected props
  const updateSettingsWrapper = {
    isPending: updateSettingsMutation.isPending,
    mutateAsync: updateSettingsMutation.mutateAsync
  };

  // Type-safe logClientActivity
  const logActivityWrapper = async (): Promise<void> => {
    await logClientActivity("client_updated", "Widget settings activity logged");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WidgetSettingsContainer
        clientId={clientId}
        settings={settings || defaultSettings}
        isClientView={!isAdmin}
        isUploading={isUploading}
        updateSettingsMutation={updateSettingsWrapper}
        handleBack={handleNavigateBack}
        handleLogoUpload={handleLogoUploadChange}
        logClientActivity={logActivityWrapper}
      />
    </div>
  );
}
