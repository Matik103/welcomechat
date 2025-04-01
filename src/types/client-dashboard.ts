
export type TimeRange = '1d' | '1m' | '1y' | 'all';

export interface DashboardStats {
  activeUsers: number;
  interactionCount: number;
  avgResponseTime: number;
  commonQueries: { query: string; count: number }[];
}

export interface ClientDashboardProps {
  clientId: string;
}

// Add missing interfaces
export interface ErrorLog {
  id: string;
  client_id?: string;
  error_type: string;
  message: string;
  created_at?: string;
  status?: 'pending' | 'resolved' | 'in_progress';
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  created_at?: string;
}

export interface ChatInteraction {
  id: string;
  client_id: string;
  query_text: string;
  response_text: string;
  created_at: string;
  agent_name?: string;
  response_time_ms?: number | null;
}

export interface ClientActivity {
  id: string;
  client_id?: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface InteractionStats {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: { query_text: string; frequency: number }[];
  success_rate?: number;
  
  // CamelCase variants for frontend compatibility
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
  topQueries: { query_text: string; frequency: number }[];
  successRate?: number;
}
