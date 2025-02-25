
import { WidgetSettings } from "./widget-settings";

export interface ClientFormData {
  client_name: string;
  email: string;
  agent_name: string;
  widget_settings?: WidgetSettings;
}
