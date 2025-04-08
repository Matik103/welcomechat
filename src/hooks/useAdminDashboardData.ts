
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
    database: {
      value: number;
      data: number[];
    };
    auth: {
      value: number;
      data: number[];
    };
    storage: {
      value: number;
      data: number[];
    };
    realtime: {
      value: number;
      data: number[];
    };
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
    database: {
      value: Math.floor(Math.random() * 1000),
      data: generateChartData()
    },
    auth: {
      value: Math.floor(Math.random() * 500),
      data: generateChartData()
    },
    storage: {
      value: Math.floor(Math.random() * 200),
      data: generateChartData()
    },
    realtime: {
      value: Math.floor(Math.random() * 100),
      data: generateChartData()
    }
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
          toast.error('Dashboard data fetch timed out. Using default data instead.');
          // Even on timeout, ensure we have data to show
          setDashboardData(prev => ({...prev}));
        }
      }, 10000); // 10 second timeout (reduced from 30)

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
            ),
            chartData: generateChartData() // Ensure we have fresh chart data
          },
          agents: {
            ...defaultDashboardData.agents,
            total: agentsData?.length || 0,
            active: agentsData?.filter(a => a.is_active).length || 0,
            changePercentage: calculateChangePercentage(
              defaultDashboardData.agents.total, 
              agentsData?.length || 0
            ),
            chartData: generateChartData() // Ensure we have fresh chart data
          },
          activityCharts: {
            database: {
              value: Math.floor(Math.random() * 1000),
              data: generateChartData()
            },
            auth: {
              value: Math.floor(Math.random() * 500),
              data: generateChartData()
            },
            storage: {
              value: Math.floor(Math.random() * 200),
              data: generateChartData()
            },
            realtime: {
              value: Math.floor(Math.random() * 100),
              data: generateChartData()
            }
          }
        };
        
        setDashboardData(newDashboardData);
        console.log("Dashboard data updated successfully");
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Using default values.');
        // On error, still update with default data to prevent UI issues
        setDashboardData(prev => ({...prev}));
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
