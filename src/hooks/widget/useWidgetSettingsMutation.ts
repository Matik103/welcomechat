
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { WidgetSettings as IWidgetSettings } from "@/types/widget-settings";
import { convertSettingsToJson } from "@/utils/widgetSettingsUtils";
import { checkAndRefreshAuth } from "@/services/authService";

/**
 * Hook to manage widget settings mutations
 */
export function useWidgetSettingsMutation(clientId: string | undefined, isClientView: boolean = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const logClientActivity = async (
    activity_type: string, 
    description: string, 
    metadata?: any
  ) => {
    if (clientId && isClientView) {
      try {
        const { useClientActivity } = await import("@/hooks/useClientActivity");
        const { logClientActivity } = useClientActivity(clientId);
        return logClientActivity(activity_type, description, metadata);
      } catch (error) {
        console.error("Error logging client activity:", error);
      }
    }
  };

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: IWidgetSettings) => {
      console.log("Saving widget settings:", newSettings);
      
      if (!clientId) {
        throw new Error("No client ID available");
      }
      
      // Ensure we have a valid auth session
      await checkAndRefreshAuth();
      
      const settingsJson = convertSettingsToJson(newSettings);
      console.log("Settings being saved to DB:", settingsJson);
      
      // Sync with AI agent if available
      import("@/utils/aiAgentSync").then(({ syncWidgetSettingsWithAgent }) => {
        syncWidgetSettingsWithAgent(clientId, newSettings)
          .then(success => {
            if (success) {
              console.log("Widget settings synchronized with AI agent");
            } else {
              console.log("Could not synchronize widget settings with AI agent");
            }
          })
          .catch(error => {
            console.error("Error syncing widget settings with AI agent:", error);
          });
      });
      
      const { error, data } = await supabase
        .from("clients")
        .update({
          widget_settings: settingsJson
        })
        .eq("id", clientId)
        .select();
      
      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }
      
      console.log("Update response:", data);
      
      // Force refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      
      return data;
    },
    onSuccess: (_, variables) => {
      if (isClientView) {
        logClientActivity(
          "widget_settings_updated", 
          "updated widget settings", 
          { updated_fields: Object.keys(variables) }
        );
      }
      
      toast({
        title: "Settings saved successfully! 🎉",
        description: "Your widget is ready to be embedded.",
      });
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateSettingsMutation: {
      isPending: updateSettingsMutation.isPending,
      mutateAsync: updateSettingsMutation.mutateAsync
    }
  };
}
