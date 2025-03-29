
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createInitialActivityCharts } from '@/utils/chartDataUtils';
import { fetchAllDashboardData } from '@/services/adminDashboardService';

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
      chartData: []
    },
    agents: {
      total: 0,
      active: 0,
      changePercentage: 0,
      chartData: []
    },
    interactions: {
      total: 0,
      changePercentage: 0,
      chartData: []
    },
    trainings: {
      total: 0,
      changePercentage: 0,
      chartData: []
    },
    administration: {
      total: 0,
      changePercentage: 0,
      chartData: []
    },
    activityCharts: createInitialActivityCharts()
  });
  
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDashboardData = await fetchAllDashboardData();
      setDashboardData(allDashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    dashboardData,
    fetchDashboardData
  };
}
