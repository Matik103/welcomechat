
import { useState, useEffect } from "react";
import { WidgetSettings as IWidgetSettings, defaultSettings, isWidgetSettings } from "@/types/widget-settings";

/**
 * Hook to manage widget settings state
 */
export function useWidgetSettingsState(client: any | null) {
  const [settings, setSettings] = useState<IWidgetSettings>(defaultSettings);

  // Update settings state when client data changes
  useEffect(() => {
    if (client) {
      console.log("Client data:", client);
      console.log("Widget settings from client:", client.widget_settings);
      
      if (client.widget_settings && isWidgetSettings(client.widget_settings)) {
        console.log("Valid widget settings detected, applying to state");
        setSettings(client.widget_settings as IWidgetSettings);
      } else {
        console.log("Invalid or missing widget settings, using defaults with agent name");
        setSettings({
          ...defaultSettings,
          agent_name: client.agent_name || ""
        });
      }
    }
  }, [client]);

  return {
    settings,
    setSettings
  };
}
