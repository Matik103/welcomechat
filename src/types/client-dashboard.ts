
import { ActivityType } from './client-form';
import { Json } from "@/integrations/supabase/types";

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
  metadata: Json;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Client status type
export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Error log type
export interface ErrorLog {
  id: string;
  client_id: string;
  client_name?: string;
  error_type: string;
  message: string;
  created_at: string;
  status?: string;
}

// Query item type for top queries
export interface QueryItem {
  id?: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  created_at?: string;
}

// Chat interaction type
export interface ChatInteraction {
  id: string;
  query_text: string;
  response_text: string;
  created_at: string;
  client_id: string;
  agent_name: string;
  response_time_ms?: number;
  metadata?: Record<string, any>;
}

// Interaction stats type
export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: QueryItem[];
  success_rate?: number;
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: QueryItem[];
  successRate?: number;
}
