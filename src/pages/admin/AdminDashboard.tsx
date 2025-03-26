import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStatCard } from '@/components/admin/DashboardStatCard';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { useNavigate } from 'react-router-dom';
import { 
  Database,
  KeyRound,
  HardDrive,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';

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
  };
  agents: {
    total: number;
    active: number;
    changePercentage: number;
  };
  interactions: {
    total: number;
    changePercentage: number;
  };
  trainings: {
    total: number;
    changePercentage: number;
  };
  administration: {
    total: number;
    changePercentage: number;
  };
  activityCharts: {
    database: ChartCardData;
    auth: ChartCardData;
    storage: ChartCardData;
    realtime: ChartCardData;
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    clients: {
      total: 0,
      active: 0,
      changePercentage: 0
    },
    agents: {
      total: 0,
      active: 0,
      changePercentage: 0
    },
    interactions: {
      total: 0,
      changePercentage: 0
    },
    trainings: {
      total: 0,
      changePercentage: 0
    },
    administration: {
      total: 0,
      changePercentage: 0
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
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
        toast.error('Failed to load dashboard statistics');
        throw statsError;
      }
      
      const { data: chartData, error: chartError } = await supabase.rpc('get_dashboard_activity_charts');
      
      if (chartError) {
        console.error('Error fetching chart data:', chartError);
        toast.error('Failed to load activity charts');
        throw chartError;
      }
      
      const parsedStatsData = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
      const parsedChartData = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
      
      setDashboardData({
        clients: parsedStatsData?.clients as DashboardData['clients'],
        agents: parsedStatsData?.agents as DashboardData['agents'],
        interactions: parsedStatsData?.interactions as DashboardData['interactions'],
        trainings: parsedStatsData?.trainings as DashboardData['trainings'],
        administration: parsedStatsData?.administration as DashboardData['administration'],
        activityCharts: parsedChartData as DashboardData['activityCharts']
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <DashboardStatCard
            title="CLIENTS"
            value={dashboardData.clients.total}
            active={dashboardData.clients.active}
            changePercentage={dashboardData.clients.changePercentage}
            bgColor="bg-[#ECFDF5]"
            onClick={() => navigate('/admin/clients')}
          />
          
          <DashboardStatCard
            title="AGENTS"
            value={dashboardData.agents.total}
            active={dashboardData.agents.active}
            changePercentage={dashboardData.agents.changePercentage}
            bgColor="bg-gray-100"
            onClick={() => navigate('/admin/agents')}
          />
          
          <DashboardStatCard
            title="INTERACTIONS"
            value={dashboardData.interactions.total}
            changePercentage={dashboardData.interactions.changePercentage}
            bgColor="bg-[#FEF9C3]"
          />
          
          <DashboardStatCard
            title="TRAININGS"
            value={dashboardData.trainings.total}
            changePercentage={dashboardData.trainings.changePercentage}
            bgColor="bg-[#EFF6FF]"
          />
          
          <DashboardStatCard
            title="ADMINISTRATION"
            value={dashboardData.administration.total}
            changePercentage={dashboardData.administration.changePercentage}
            bgColor="bg-[#FEE2E2]"
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
