
export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: Array<{query_text: string; frequency: number}>;
  successRate?: number; // Optional field for backward compatibility
  
  // Add camelCase aliases for frontend compatibility
  totalInteractions?: number;
  activeDays?: number;
  averageResponseTime?: number;
  topQueries?: Array<{query_text: string; frequency: number}>;
}

// Alias for backward compatibility
export type DashboardStats = InteractionStats;

export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  created_at: string;
  status: string;
  client_id?: string;
  query_text?: string;
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  client_id?: string;
  created_at?: string;
}
