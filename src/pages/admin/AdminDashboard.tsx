import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStatCard } from '@/components/admin/DashboardStatCard';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { useNavigate } from 'react-router-dom';
import { 
  Database,
  KeyRound,
  HardDrive,
  Zap,
  Users,
  MessagesSquare,
  Lightbulb,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { AnimatedBarChart } from '@/components/dashboard/AnimatedBarChart';
import { Card } from '@/components/ui/card';
import { getAllAgents } from '@/services/agentService';

interface ActivityChartData {
  name: string;
  value: number;
}

interface ChartCardData {
  value: string;
  title: string;
  subtitle: string;
  data: ActivityChartData[];
}

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
    database: ChartCardData;
    auth: ChartCardData;
    storage: ChartCardData;
    realtime: ChartCardData;
  };
}

// Helper to generate random chart data
const generateChartData = (length = 24) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
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
  
  useEffect(() => {
    setupRealtimeActivities().then(success => {
      if (success) {
        console.log('Realtime subscriptions set up successfully');
      } else {
        console.error('Failed to set up realtime subscriptions');
      }
    });
    
    fetchDashboardData();
    
    const activitiesChannel = subscribeToAllActivities(() => {
      console.log('Activities changed, refreshing dashboard data');
      fetchDashboardData();
    });
    
    const agentsChannel = supabase.channel('public:ai_agents_dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agents',
      }, () => {
        fetchDashboardData();
      })
      .subscribe();
      
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []);

  const StatCardWithChart = ({ 
    title, 
    value, 
    active, 
    changePercentage, 
    bgColor, 
    chartData, 
    chartColor,
    icon,
    onClick
  }: {
    title: string;
    value: number;
    active?: number; 
    changePercentage?: number;
    bgColor: string;
    chartData: number[];
    chartColor: string;
    icon: React.ReactNode;
    onClick: () => void;
  }) => (
    <Card
      className={`${bgColor} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="font-bold">{title}</h3>
        </div>
        <div className="text-2xl font-bold mb-1">{value.toLocaleString()}</div>
        {active !== undefined && (
          <div className="text-sm opacity-80 mb-1">{active} Active</div>
        )}
        {changePercentage !== undefined && (
          <div className={`text-sm ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {changePercentage >= 0 ? `+${changePercentage.toFixed(1)}%` : `${changePercentage.toFixed(1)}%`}
          </div>
        )}
        <div className="h-[40px] mt-3">
          <AnimatedBarChart 
            data={chartData} 
            color={chartColor} 
            updateInterval={150}
          />
        </div>
      </div>
    </Card>
  );
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCardWithChart
            title="CLIENTS"
            value={dashboardData.clients.total}
            active={dashboardData.clients.active}
            changePercentage={dashboardData.clients.changePercentage}
            bgColor="bg-[#ECFDF5]"
            chartData={dashboardData.clients.chartData}
            chartColor="#059669"
            icon={<Users size={18} className="text-green-600" />}
            onClick={() => navigate('/admin/clients')}
          />
          
          <StatCardWithChart
            title="AGENTS"
            value={dashboardData.agents.total}
            active={dashboardData.agents.active}
            changePercentage={dashboardData.agents.changePercentage}
            bgColor="bg-gray-100"
            chartData={dashboardData.agents.chartData}
            chartColor="#4B5563"
            icon={<Database size={18} className="text-gray-600" />}
            onClick={() => navigate('/admin/agents')}
          />
          
          <StatCardWithChart
            title="INTERACTIONS"
            value={dashboardData.interactions.total}
            changePercentage={dashboardData.interactions.changePercentage}
            bgColor="bg-[#FEF9C3]"
            chartData={dashboardData.interactions.chartData}
            chartColor="#CA8A04"
            icon={<MessagesSquare size={18} className="text-yellow-600" />}
            onClick={() => {}} // Not clickable for now
          />
          
          <StatCardWithChart
            title="TRAININGS"
            value={dashboardData.trainings.total}
            changePercentage={dashboardData.trainings.changePercentage}
            bgColor="bg-[#EFF6FF]"
            chartData={dashboardData.trainings.chartData}
            chartColor="#2563EB"
            icon={<Lightbulb size={18} className="text-blue-600" />}
            onClick={() => {}} // Not clickable for now
          />
          
          <StatCardWithChart
            title="ADMINISTRATION"
            value={dashboardData.administration.total}
            changePercentage={dashboardData.administration.changePercentage}
            bgColor="bg-[#FEE2E2]"
            chartData={dashboardData.administration.chartData}
            chartColor="#DC2626"
            icon={<Settings size={18} className="text-red-600" />}
            onClick={() => {}} // Not clickable for now
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActivityChartCard
            title="Database"
            subtitle="REST Requests"
            value={dashboardData.activityCharts.database.value}
            data={dashboardData.activityCharts.database.data}
            icon={<Database size={18} />}
          />
          
          <ActivityChartCard
            title="Auth"
            subtitle="Auth Requests"
            value={dashboardData.activityCharts.auth.value}
            data={dashboardData.activityCharts.auth.data}
            icon={<KeyRound size={18} />}
          />
          
          <ActivityChartCard
            title="Storage"
            subtitle="Storage Requests"
            value={dashboardData.activityCharts.storage.value}
            data={dashboardData.activityCharts.storage.data}
            icon={<HardDrive size={18} />}
          />
          
          <ActivityChartCard
            title="Realtime"
            subtitle="Realtime Requests"
            value={dashboardData.activityCharts.realtime.value}
            data={dashboardData.activityCharts.realtime.data}
            icon={<Zap size={18} />}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
