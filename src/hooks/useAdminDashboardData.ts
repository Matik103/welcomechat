import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAllAgents } from '@/services/agentService';

// Helper to generate random chart data
const generateChartData = (length = 24) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

// Helper to calculate percentage change
const calculateChangePercentage = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
};

interface DashboardData {
  clients: {
    total: number;
    active: number;
    changePercentage: number;
    chartData: number[];
  };
  agents: {
    total: number;
    active: number;
    changePercentage: number;
    chartData: number[];
  };
  interactions: {
    total: number;
    changePercentage: number;
    chartData: number[];
    recent: number;
  };
  trainings: {
    total: number;
    changePercentage: number;
    chartData: number[];
  };
  administration: {
    total: number;
    changePercentage: number;
    chartData: number[];
    recent: number;
  };
  activityCharts: {
    database: any;
    auth: any;
    storage: any;
    realtime: any;
  };
}

export function useAdminDashboardData() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    clients: {
      total: 0,
      active: 0,
      changePercentage: 0,
      chartData: generateChartData()
    },
    agents: {
      total: 0,
      active: 0,
      changePercentage: 0,
      chartData: generateChartData()
    },
    interactions: {
      total: 0,
      changePercentage: 0,
      chartData: generateChartData(),
      recent: 0
    },
    trainings: {
      total: 0,
      changePercentage: 0,
      chartData: generateChartData()
    },
    administration: {
      total: 0,
      changePercentage: 0,
      chartData: generateChartData(),
      recent: 0
    },
    activityCharts: {
      database: null,
      auth: null,
      storage: null,
      realtime: null
    }
  });

  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    try {
      setIsLoading(true);

      // Set a timeout to prevent infinite loading
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsLoading(false);
          toast.error('Dashboard data fetch timed out. Please try again.');
        }
      }, 30000); // 30 second timeout

      // Fetch clients data
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch agents data
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('id, is_active, created_at')
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      if (isMountedRef.current) {
        setDashboardData(prev => ({
          ...prev,
          clients: {
            ...prev.clients,
            total: clientsData?.length || 0,
            active: clientsData?.filter(c => c.status === 'active').length || 0,
            changePercentage: calculateChangePercentage(prev.clients.total, clientsData?.length || 0)
          },
          agents: {
            ...prev.agents,
            total: agentsData?.length || 0,
            active: agentsData?.filter(a => a.is_active).length || 0,
            changePercentage: calculateChangePercentage(prev.agents.total, agentsData?.length || 0)
          }
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchDashboardData]);

  return {
    isLoading,
    dashboardData,
    fetchDashboardData
  };
}
