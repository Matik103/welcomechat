import { WidgetSettings } from "./widget-settings";

export interface Client {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  color?: string;
  logo?: string;
  logo_url?: string;
  agent_name?: string;
  agent_description?: string;
  openai_enabled?: boolean;
  openai_assistant_id?: string;
  openai_model?: string;
  openai_temperature?: number;
  openai_max_tokens?: number;
  deepseek_enabled?: boolean;
  deepseek_model?: string;
  deepseek_assistant_id?: string;
  widget_settings?: WidgetSettings;
  website_urls?: WebsiteUrl[];
  documents?: DocumentLink[];
  queries?: string[];
  error_logs?: any[];
  interactions?: number;
  last_interaction?: string;
  query_count?: number;
  error_count?: number;
  data?: any;
  chat_history?: any[];
  website_url_refresh_rate?: number;
}

export interface WebsiteUrl {
  id: string;
  client_id: string;
  url: string;
  status: string;
  last_crawl: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentLink {
  id: string;
  client_id: string;
  document_url: string;
  document_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}
