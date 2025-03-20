
import { WidgetSettings } from "./widget-settings";
import { Json } from "@/integrations/supabase/types";

export type AccessStatus = "public" | "restricted" | "unknown";

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  access_status?: AccessStatus;
  created_at?: string;
  document_type?: string;
}

// Add DriveLink as an alias to DocumentLink for backward compatibility
export type DriveLink = DocumentLink;

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
  agent_name?: string;
  agent_description?: string;
  widget_settings?: Json;
  company?: string;
  description?: string;
  logo_url?: string;
  logo_storage_path?: string;
}

export interface Client extends ClientFormData {
  id: string;
  created_at?: string;
  updated_at?: string;
  deletion_scheduled_at?: string;
  deleted_at?: string;
  last_active?: string;
  status?: string;
  website_url?: string;
  drive_link?: string;
  drive_link_added_at?: string;
  website_url_added_at?: string;
  // Add agent_name as an optional field to avoid TypeScript errors
  agent_name?: string;
}
