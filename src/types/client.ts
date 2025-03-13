import { WidgetSettings } from "./widget-settings";
import { Json } from "@/integrations/supabase/types";

export type AccessStatus = "public" | "restricted" | "unknown";

export interface DriveLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  access_status?: AccessStatus;
  created_at?: string;
}

export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at?: string;
}

export interface ClientFormData {
  client_name: string;
  email: string;
  agent_name: string;
  widget_settings?: Json;
  company?: string;
  description?: string;
}

export interface AIAgent {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  ai_agents?: AIAgent;
  created_at: string;
  updated_at: string;
}

export interface ClientWithAgent extends Client {
  ai_agents: AIAgent;
}
