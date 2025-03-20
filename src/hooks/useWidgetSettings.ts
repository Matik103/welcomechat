
import { useWidgetSettingsState } from "./widget/useWidgetSettingsState";
import { useWidgetSettingsData } from "./widget/useWidgetSettingsData";
import { useWidgetSettingsMutation } from "./widget/useWidgetSettingsMutation";
import { useLogoUpload } from "./widget/useLogoUpload";
import { useQueryClient } from "@tanstack/react-query";
import { WidgetSettings as IWidgetSettings } from "@/types/widget-settings";
import { useClientActivity } from "@/hooks/useClientActivity";

export function useWidgetSettings(clientId: string | undefined, isClientView: boolean = false) {
  const queryClient = useQueryClient();
  const { logClientActivity } = useClientActivity(clientId);
  
  // Fetch client data including widget settings
  const { client, isLoading, refetchClient } = useWidgetSettingsData(clientId);
  
  // Manage widget settings state
  const { settings, setSettings } = useWidgetSettingsState(client);
  
  // Handle mutations for widget settings
  const { updateSettingsMutation } = useWidgetSettingsMutation(clientId, isClientView);
  
  // Handle logo upload
  const { isUploading, handleLogoUpload } = useLogoUpload(
    clientId, 
    settings, 
    setSettings, 
    () => {
      return refetchClient().then(() => {
        queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      });
    },
    isClientView
  );

  return {
    settings,
    setSettings,
    isLoading,
    isUploading,
    client,
    refetchClient,
    updateSettingsMutation: {
      isPending: updateSettingsMutation.isPending,
      mutateAsync: async (newSettings: IWidgetSettings): Promise<void> => {
        await updateSettingsMutation.mutateAsync(newSettings);
      }
    },
    handleLogoUpload
  };
}
