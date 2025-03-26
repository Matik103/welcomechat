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

// Mock data for the activity charts
const generateChartData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    name: `Hour ${i}`,
    value: Math.floor(Math.random() * 50) + 10
  }));
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  
  // Mock data for the dashboard
  const dashboardData = {
    clients: {
      total: 12,
      active: 10,
      changePercentage: 18
    },
    agents: {
      total: 18,
      active: 10,
      changePercentage: 19
    },
    interactions: {
      total: 1234,
      changePercentage: 18
    },
    trainings: {
      total: 484,
      changePercentage: 18
    },
    administration: {
      total: 123,
      changePercentage: 18
    },
    activityCharts: {
      database: {
        value: "13,393",
        title: "Database",
        subtitle: "REST Requests",
        data: generateChartData()
      },
      auth: {
        value: "382",
        title: "Auth",
        subtitle: "Auth Requests",
        data: generateChartData()
      },
      storage: {
        value: "99",
        title: "Storage",
        subtitle: "Storage Requests",
        data: generateChartData()
      },
      realtime: {
        value: "327",
        title: "Realtime",
        subtitle: "Realtime Requests",
        data: generateChartData()
      }
    }
  };
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
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
        
        {/* Activity Charts */}
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
