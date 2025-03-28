
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
import { AnimatedBarChart } from '@/components/charts/AnimatedBarChart';
import { Card } from '@/components/ui/card';

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
        clients: {
          ...parsedStatsData?.clients,
          chartData: generateChartData()
        },
        agents: {
          ...parsedStatsData?.agents,
          chartData: generateChartData()
        },
        interactions: {
          ...parsedStatsData?.interactions,
          chartData: generateChartData()
        },
        trainings: {
          ...parsedStatsData?.trainings,
          chartData: generateChartData()
        },
        administration: {
          ...parsedStatsData?.administration,
          chartData: generateChartData()
        },
        activityCharts: parsedChartData
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
            barWidth={3}
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
            onClick={() => {}}
          />
          
          <StatCardWithChart
            title="TRAININGS"
            value={dashboardData.trainings.total}
            changePercentage={dashboardData.trainings.changePercentage}
            bgColor="bg-[#EFF6FF]"
            chartData={dashboardData.trainings.chartData}
            chartColor="#2563EB"
            icon={<Lightbulb size={18} className="text-blue-600" />}
            onClick={() => {}}
          />
          
          <StatCardWithChart
            title="ADMINISTRATION"
            value={dashboardData.administration.total}
            changePercentage={dashboardData.administration.changePercentage}
            bgColor="bg-[#FEE2E2]"
            chartData={dashboardData.administration.chartData}
            chartColor="#DC2626"
            icon={<Settings size={18} className="text-red-600" />}
            onClick={() => {}}
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
