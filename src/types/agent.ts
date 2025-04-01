
import { Json } from "@/integrations/supabase/types";

export interface ChatInteraction {
  id: string;
  client_id: string;
  query_text: string;
  response: string;
  created_at: string;
  agent_name: string;
  response_time_ms: number | null;
  metadata?: Json;
}

export interface CommonQuery {
  query_text: string;
  frequency: number;
}

export interface AgentStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: CommonQuery[];
}

export interface AgentError {
  id: string;
  error_type: string;
  error_message: string;
  error_status: string;
  query_text?: string;
  created_at: string;
}

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  document_type: string;
  access_status?: string;
  notified_at?: string;
  created_at: string;
}

export interface AgentDetails {
  id: string;
  name: string;
  agent_description?: string;
  ai_prompt?: string;
  logo_url?: string;
  client_id: string;
  client_name?: string;
  settings?: Json;
  created_at: string;
  updated_at: string;
}
