
export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: string[];
}

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
  client_id: string;
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string; // Make this optional with ?
}
