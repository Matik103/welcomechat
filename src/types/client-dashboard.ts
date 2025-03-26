
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
