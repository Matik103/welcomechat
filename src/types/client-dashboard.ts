
// Define the structure for interaction statistics
export interface InteractionStats {
  // Snake_case versions (for API compatibility)
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: QueryItem[];
  success_rate: number;
  
  // CamelCase versions (for frontend)
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: QueryItem[];
  successRate: number;
}

// Define query item structure
export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  created_at?: string;
  client_id?: string;
}

// Define chat interaction structure
export interface ChatInteraction {
  id: string;
  query_text: string;
  response_text?: string;
  created_at: string;
  client_id?: string;
}

// Define error log structure
export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status?: string;
}
