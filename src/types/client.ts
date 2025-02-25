
import { WidgetSettings } from "./widget-settings";
import { Json } from "@/integrations/supabase/types";

export interface DriveLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
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
}

export interface Client extends ClientFormData {
  id: string;
  created_at?: string;
  updated_at?: string;
  company?: string;
  description?: string;
  deletion_scheduled_at?: string;
  deleted_at?: string;
  last_active?: string;
  status?: string;
  website_url?: string;
  drive_link?: string;
  drive_link_added_at?: string;
  website_url_added_at?: string;
}
