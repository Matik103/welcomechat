
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAllAgents } from '@/services/agentService';

// Helper to generate random chart data
const generateChartData = (length = 24) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
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
  const [error, setError] = useState<Error | null>(null);
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
      chartData: generateChartData()
    },
    trainings: {
      total: 0,
      changePercentage: 0,
      chartData: generateChartData()
    },
    administration: {
      total: 0,
      changePercentage: 0,
      chartData: generateChartData()
    },
    activityCharts: {
      database: {
        value: "0",
        title: "Database",
        subtitle: "REST Requests",
        data: []
      },
      auth: {
        value: "0",
        title: "Auth",
        subtitle: "Auth Requests",
        data: []
      },
      storage: {
        value: "0",
        title: "Storage",
        subtitle: "Storage Requests",
        data: []
      },
      realtime: {
        value: "0",
        title: "Realtime",
        subtitle: "Realtime Requests",
        data: []
      }
    }
  });
  
  const lastFetchTimeRef = useRef<number>(0);
  const initialLoadDoneRef = useRef<boolean>(false);
  const fetchInProgressRef = useRef<boolean>(false);
  
  const fetchDashboardData = useCallback(async (force = false) => {
    // Prevent multiple concurrent fetches
    if (fetchInProgressRef.current && !force) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 10000) {
      console.log('Skipping dashboard refresh - too soon after last fetch');
      return;
    }
    
    fetchInProgressRef.current = true;
    lastFetchTimeRef.current = now;
    
    if (!initialLoadDoneRef.current) {
      setIsLoading(true);
    }
    
    try {
      console.log('Fetching dashboard data...');
      
      // Get all agents
      const agents = await getAllAgents();
      const totalAgents = agents.length;
      
      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - 48);
      
      const activeAgents = agents.filter(agent => 
        agent.last_active && new Date(agent.last_active) > timeAgo
      ).length;
      
      // Get agent data from database
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('client_id, last_active, status, deleted_at')
        .eq('interaction_type', 'config')
        .eq('status', 'active')
        .is('deleted_at', null);
      
      if (agentsError) throw agentsError;
      
      // Process client data
      const uniqueClientIds = new Set();
      const activeClientIds = new Set();
      
      for (const agent of agentsData || []) {
        if (agent.client_id) {
          uniqueClientIds.add(agent.client_id);
          
          if (agent.last_active && new Date(agent.last_active) > timeAgo) {
            activeClientIds.add(agent.client_id);
          }
        }
      }
      
      const totalClients = uniqueClientIds.size;
      const activeClients = activeClientIds.size;
      
      const clientGrowthRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
      const agentGrowthRate = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;
      
      // Get interaction count
      const { count: interactionsCount, error: interactionsError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact', head: true })
        .eq('interaction_type', 'chat_interaction');
      
      if (interactionsError) throw interactionsError;
      
      // Get training resources count
      const { count: websiteUrlsCount, error: websiteUrlsError } = await supabase
        .from('website_urls')
        .select('id', { count: 'exact', head: true });
      
      if (websiteUrlsError) throw websiteUrlsError;
      
      const { count: documentLinksCount, error: documentLinksError } = await supabase
        .from('document_links')
        .select('id', { count: 'exact', head: true });
      
      if (documentLinksError) throw documentLinksError;
      
      const { count: driveLinksCount, error: driveLinksError } = await supabase
        .from('google_drive_links')
        .select('id', { count: 'exact', head: true });
      
      if (driveLinksError) throw driveLinksError;
      
      const trainingsTotal = (websiteUrlsCount || 0) + (documentLinksCount || 0) + (driveLinksCount || 0);
      
      // Get admin activities count
      const { count: adminActivitiesCount, error: adminActivitiesError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .in('type', ['client_created', 'client_updated', 'client_deleted']);
      
      if (adminActivitiesError) throw adminActivitiesError;
      
      // Get chart data
      let chartData;
      try {
        const { data: rpcData, error: chartError } = await supabase.rpc('get_dashboard_activity_charts');
        
        if (chartError) throw chartError;
        
        chartData = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      } catch (chartErr) {
        console.error('Error fetching chart data:', chartErr);
        // Provide fallback chart data
        chartData = {
          database: {
            value: "0",
            title: "Database",
            subtitle: "REST Requests",
            data: generateChartData()
          },
          auth: {
            value: "0",
            title: "Auth",
            subtitle: "Auth Requests",
            data: generateChartData()
          },
          storage: {
            value: "0",
            title: "Storage",
            subtitle: "Storage Requests",
            data: generateChartData()
          },
          realtime: {
            value: "0",
            title: "Realtime",
            subtitle: "Realtime Requests",
            data: generateChartData()
          }
        };
      }
      
      // Update dashboard data
      setDashboardData({
        clients: {
          total: totalClients,
          active: activeClients,
          changePercentage: clientGrowthRate,
          chartData: generateChartData()
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
          changePercentage: agentGrowthRate,
          chartData: generateChartData()
        },
        interactions: {
          total: interactionsCount || 0,
          changePercentage: 12,
          chartData: generateChartData()
        },
        trainings: {
          total: trainingsTotal,
          changePercentage: 15,
          chartData: generateChartData()
        },
        administration: {
          total: adminActivitiesCount || 0,
          changePercentage: 3,
          chartData: generateChartData()
        },
        activityCharts: chartData
      });
      
      setError(null);
      initialLoadDoneRef.current = true;
      console.log('Dashboard data fetched successfully');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData(true);
    
    const pollingInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes polling
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchDashboardData]);
  
  // Refresh on visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFetchTimeRef.current > 30000) {
          console.log('Page became visible after 30+ seconds - refreshing dashboard data');
          fetchDashboardData();
        } else {
          console.log('Page became visible, but skipping refresh (refreshed recently)');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  return {
    isLoading,
    error,
    dashboardData,
    fetchDashboardData
  };
}
