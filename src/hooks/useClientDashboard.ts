import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from '@supabase/supabase-js';

// Import types
import { ErrorLog, InteractionStats, QueryItem } from "@/types/client-dashboard";

// Import services
import { fetchErrorLogs, subscribeToErrorLogs } from "@/services/errorLogService";
import { fetchQueries, subscribeToQueries } from "@/services/queryService";
import { fetchDashboardStats, subscribeToAgentData, subscribeToActivities } from "@/services/statsService";
import { DashboardStats } from '@/services/statsService';

export type { ErrorLog, InteractionStats, QueryItem };

export function useClientDashboard(clientId: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    totalSessions: 0,
    averageResponseTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    let agentSubscription: RealtimeChannel | null = null;
    let activitiesSubscription: RealtimeChannel | null = null;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const dashboardStats = await fetchDashboardStats(clientId);
        setStats(dashboardStats);
        
        // Subscribe to agent data updates
        agentSubscription = subscribeToAgentData(clientId, (data) => {
          if (data) {
            loadDashboardData();
          }
        });

        // Subscribe to activities
        activitiesSubscription = subscribeToActivities(clientId, (data) => {
          if (data) {
            setActivities((prev) => [data, ...prev].slice(0, 10));
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    if (clientId) {
      loadDashboardData();
    }

    return () => {
      agentSubscription?.unsubscribe();
      activitiesSubscription?.unsubscribe();
    };
  }, [clientId]);

  return {
    stats,
    isLoading,
    error,
    activities,
  };
}
