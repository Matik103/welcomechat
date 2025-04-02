
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
  
  const fetchDashboardData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 10000) {
      console.log('Skipping dashboard refresh - too soon after last fetch');
      return;
    }
    
    lastFetchTimeRef.current = now;
    
    if (!initialLoadDoneRef.current) {
      setIsLoading(true);
    }
    
    try {
      const agents = await getAllAgents();
      const totalAgents = agents.length;
      
      // Get last 24 hours timestamp
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      const last24HoursStr = last24Hours.toISOString();
      
      // For agents active in the last 24 hours
      const activeAgents = agents.filter(agent => 
        agent.last_active && new Date(agent.last_active) > last24Hours
      ).length;
      
      // Get clients with their last_active status
      const { data: clientsData, error: clientsError } = await supabase
        .from('ai_agents')  // Changed from 'clients' to 'ai_agents' to match the actual table structure
        .select('id, client_id, last_active, status, deleted_at')
        .eq('interaction_type', 'config')  // Only get config records which represent clients
        .eq('status', 'active')
        .is('deleted_at', null);
      
      if (clientsError) throw clientsError;
      
      // Use a Set to count unique client_ids
      const uniqueClientIds = new Set();
      clientsData.forEach(client => {
        if (client.client_id) uniqueClientIds.add(client.client_id);
      });
      const totalClients = uniqueClientIds.size;
      
      // Count clients active in the last 24 hours
      const activeClients = clientsData.filter(client => 
        client.last_active && new Date(client.last_active) > last24Hours
      ).length;
      
      // Calculate growth percentages
      const clientGrowthRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
      const agentGrowthRate = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;
      
      // Get total interactions count
      const { count: interactionsCount, error: interactionsError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact', head: true })
        .eq('interaction_type', 'chat_interaction');
      
      if (interactionsError) throw interactionsError;
      
      // Get recent interactions (last 24 hours)
      const { count: recentInteractionsCount, error: recentInteractionsError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact', head: true })
        .eq('interaction_type', 'chat_interaction')
        .gt('created_at', last24HoursStr);
      
      if (recentInteractionsError) throw recentInteractionsError;
      
      // Count training resources
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
      
      // Get administration activities
      const { count: adminActivitiesCount, error: adminActivitiesError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .in('type', ['client_created', 'client_updated', 'client_deleted']);
      
      if (adminActivitiesError) throw adminActivitiesError;
      
      // Get chart data from the function
      const { data: chartData, error: chartError } = await supabase.rpc('get_dashboard_activity_charts');
      
      if (chartError) throw chartError;
      
      const parsedChartData = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;

      // For administration card, count recent clients who logged in the last 24 hours
      // This is similar to activeClients but we're tracking it separately for the administration card
      const recentAdminLogins = activeClients;
      
      // Calculate growth metrics
      const interactionsChangePercentage = 
        recentInteractionsCount && interactionsCount ? 
        Math.round((recentInteractionsCount / (interactionsCount - recentInteractionsCount)) * 100) : 0;
      
      const adminChangePercentage = 
        recentAdminLogins && totalClients ? 
        Math.round((recentAdminLogins / totalClients) * 100) : 0;
      
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
          changePercentage: interactionsChangePercentage,
          chartData: generateChartData(),
          recent: recentInteractionsCount || 0
        },
        trainings: {
          total: trainingsTotal,
          changePercentage: 15,
          chartData: generateChartData()
        },
        administration: {
          total: adminActivitiesCount || 0,
          changePercentage: adminChangePercentage,
          chartData: generateChartData(),
          recent: recentAdminLogins || 0
        },
        activityCharts: parsedChartData
      });
      
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
    
    const pollingInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchDashboardData]);
  
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
    dashboardData,
    fetchDashboardData
  };
}
