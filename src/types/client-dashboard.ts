
export interface InteractionStats {
  // Snake case properties (original)
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: Array<{query_text: string; frequency: number}>;
  success_rate?: number; // Optional field for backward compatibility
  
  // Camel case aliases for frontend compatibility
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: Array<{query_text: string; frequency: number}>;
  successRate?: number; // Added for compatibility with frontend code
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
  id?: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  client_id?: string;
  created_at?: string;
}

// Define ChatInteraction to include both query_text and other properties
export interface ChatInteraction {
  id: string;
  query?: string;
  query_text?: string; // For compatibility
  response?: string;
  created_at: string;
  timestamp?: string; // Alternative field name
  agent_name?: string;
  metadata?: any;
  clientId?: string; // Added for compatibility
  client_id?: string; // Original field name
}
