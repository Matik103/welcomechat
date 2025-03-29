
import { useState, useEffect } from 'react';
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
  
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get information about agents
      const agents = await getAllAgents();
      const totalAgents = agents.length;
      
      // Time threshold for "active" clients and agents (48 hours ago)
      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - 48);
      
      // Active agents: agents with activity in last 48 hours
      const activeAgents = agents.filter(agent => 
        agent.last_active && new Date(agent.last_active) > timeAgo
      ).length;
      
      // Clients: Get all unique client_ids from ai_agents table (exclude deleted)
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('client_id, last_active, status, deleted_at')
        .eq('interaction_type', 'config')
        .eq('status', 'active')
        .is('deleted_at', null);
      
      if (agentsError) throw agentsError;
      
      // Get unique client IDs to count total active clients
      const uniqueClientIds = new Set();
      const activeClientIds = new Set();
      
      for (const agent of agentsData) {
        if (agent.client_id) {
          uniqueClientIds.add(agent.client_id);
          
          // Count as active if has activity in last 48 hours
          if (agent.last_active && new Date(agent.last_active) > timeAgo) {
            activeClientIds.add(agent.client_id);
          }
        }
      }
      
      const totalClients = uniqueClientIds.size;
      const activeClients = activeClientIds.size;
      
      // Calculate client growth rate from active/total ratio
      const clientGrowthRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
      
      // Get the growth rate for agents based on active/total ratio
      const agentGrowthRate = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;
      
      // Interactions: Count all chat interactions
      const { count: interactionsCount, error: interactionsError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact', head: true })
        .eq('interaction_type', 'chat_interaction');
      
      if (interactionsError) throw interactionsError;
      
      // Trainings: Combine count of website URLs and document links
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
      
      // Administration: Count administration-related activities using activities table
      const { count: adminActivitiesCount, error: adminActivitiesError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .in('type', ['client_created', 'client_updated', 'client_deleted']);
      
      if (adminActivitiesError) throw adminActivitiesError;
      
      // Get activity charts data from RPC function
      const { data: chartData, error: chartError } = await supabase.rpc('get_dashboard_activity_charts');
      
      if (chartError) throw chartError;
      
      const parsedChartData = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
      
      // Update state with all fetched data
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
          changePercentage: 12, // Mock data for now
          chartData: generateChartData()
        },
        trainings: {
          total: trainingsTotal,
          changePercentage: 15, // Mock data for now
          chartData: generateChartData()
        },
        administration: {
          total: adminActivitiesCount || 0,
          changePercentage: 3, // Mock data for now
          chartData: generateChartData()
        },
        activityCharts: parsedChartData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    dashboardData,
    fetchDashboardData
  };
}
