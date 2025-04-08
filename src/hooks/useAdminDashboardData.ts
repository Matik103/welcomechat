
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Default dashboard data to prevent null/undefined issues
const defaultDashboardData: DashboardData = {
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
    database: generateChartData(),
    auth: generateChartData(),
    storage: generateChartData(),
    realtime: generateChartData()
  }
};

export function useAdminDashboardData() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);

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
      console.log("Fetching dashboard data...");
      setIsLoading(true);

      // Set a timeout to prevent infinite loading
      fetchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log("Dashboard data fetch timed out");
          setIsLoading(false);
          toast.error('Dashboard data fetch timed out. Please try again.');
        }
      }, 30000); // 30 second timeout

      // Fetch clients data
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error("Error fetching clients data:", clientsError);
        throw clientsError;
      }

      // Fetch agents data
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('id, is_active, created_at')
        .order('created_at', { ascending: false });

      if (agentsError) {
        console.error("Error fetching agents data:", agentsError);
        throw agentsError;
      }

      console.log("Data fetched successfully:", { 
        clientsCount: clientsData?.length || 0, 
        agentsCount: agentsData?.length || 0 
      });

      if (isMountedRef.current) {
        // Even if there's no data, update with default values to avoid undefined errors
        const newDashboardData = {
          ...defaultDashboardData,
          clients: {
            ...defaultDashboardData.clients,
            total: clientsData?.length || 0,
            active: clientsData?.filter(c => c.status === 'active').length || 0,
            changePercentage: calculateChangePercentage(
              defaultDashboardData.clients.total, 
              clientsData?.length || 0
            )
          },
          agents: {
            ...defaultDashboardData.agents,
            total: agentsData?.length || 0,
            active: agentsData?.filter(a => a.is_active).length || 0,
            changePercentage: calculateChangePercentage(
              defaultDashboardData.agents.total, 
              agentsData?.length || 0
            )
          }
        };
        
        setDashboardData(newDashboardData);
        console.log("Dashboard data updated successfully");
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        console.log("Setting isLoading to false");
        setIsLoading(false);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    console.log("useAdminDashboardData mounted");
    isMountedRef.current = true;
    
    // Initial data fetch
    fetchDashboardData();

    return () => {
      console.log("useAdminDashboardData unmounting");
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
