
import React from 'react';
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
import { toast } from 'sonner';
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState<DashboardData>({
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
  
  React.useEffect(() => {
    // For now, we're just rendering a simple dashboard
    // We'll add functionality later
    setIsLoading(false);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <DashboardStatCard
          title="CLIENTS"
          value={12}
          active={8}
          changePercentage={10}
          bgColor="bg-[#ECFDF5]"
          onClick={() => navigate('/admin/clients')}
        />
        
        <DashboardStatCard
          title="AGENTS"
          value={5}
          active={3}
          changePercentage={5}
          bgColor="bg-gray-100"
          onClick={() => navigate('/admin/agents')}
        />
        
        <DashboardStatCard
          title="INTERACTIONS"
          value={256}
          changePercentage={15}
          bgColor="bg-[#FEF9C3]"
        />
        
        <DashboardStatCard
          title="TRAININGS"
          value={42}
          changePercentage={8}
          bgColor="bg-[#EFF6FF]"
        />
        
        <DashboardStatCard
          title="ADMINISTRATION"
          value={18}
          changePercentage={3}
          bgColor="bg-[#FEE2E2]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActivityChartCard
          title="Database"
          subtitle="REST Requests"
          value="128"
          data={[]}
          icon={<Database size={18} />}
        />
        
        <ActivityChartCard
          title="Auth"
          subtitle="Auth Requests"
          value="56"
          data={[]}
          icon={<KeyRound size={18} />}
        />
        
        <ActivityChartCard
          title="Storage"
          subtitle="Storage Requests"
          value="32"
          data={[]}
          icon={<HardDrive size={18} />}
        />
        
        <ActivityChartCard
          title="Realtime"
          subtitle="Realtime Requests"
          value="24"
          data={[]}
          icon={<Zap size={18} />}
        />
      </div>
    </div>
  );
}
