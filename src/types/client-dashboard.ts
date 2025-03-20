
import { Json } from "@/integrations/supabase/types";

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  created_at?: string;
  client_id?: string;
  last_asked?: string; // Added missing property
}

export interface InteractionStats {
  // Snake case properties (from API)
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: QueryItem[];
  success_rate: number;
  
  // Camel case properties (for frontend)
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: QueryItem[];
  successRate: number;
}

export interface ChatInteraction {
  id: string;
  client_id?: string;
  agent_name?: string;
  query_text: string;
  response: string;
  response_time_ms?: number;
  created_at: string;
  topic?: string;
  sentiment?: string;
  is_error?: boolean;
  error_type?: string;
  error_message?: string;
}

export interface ErrorLog {
  id: string;
  client_id: string;
  error_type: string;
  message: string;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
  updated_at?: string;
  handled_by?: string;
  resolution_note?: string;
  query_text?: string;
  source?: string;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: Json;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Add ClientStatus type for DeleteClientDialog.tsx
export type ClientStatus = 'active' | 'inactive' | 'deleted';
