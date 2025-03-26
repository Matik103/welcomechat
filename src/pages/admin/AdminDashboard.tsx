
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStatCard } from '@/components/admin/DashboardStatCard';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  KeyRound, 
  HardDrive, 
  Zap 
} from 'lucide-react';

// Mock data for the activity charts
const generateMockData = () => {
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
      changePercentage: 15
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
        data: generateMockData()
      },
      auth: {
        value: "382",
        title: "Auth",
        subtitle: "Auth Requests",
        data: generateMockData()
      },
      storage: {
        value: "99",
        title: "Storage",
        subtitle: "Storage Requests",
        data: generateMockData()
      },
      realtime: {
        value: "327",
        title: "Realtime",
        subtitle: "Realtime Requests",
        data: generateMockData()
      }
    }
  };
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <DashboardStatCard
            title="Clients"
            value={dashboardData.clients.total}
            active={dashboardData.clients.active}
            changePercentage={dashboardData.clients.changePercentage}
            bgColor="bg-green-50"
            onClick={() => navigate('/admin/clients')}
          />
          
          <DashboardStatCard
            title="Agents"
            value={dashboardData.agents.total}
            active={dashboardData.agents.active}
            changePercentage={dashboardData.agents.changePercentage}
            bgColor="bg-gray-50"
            onClick={() => navigate('/admin/agents')}
          />
          
          <DashboardStatCard
            title="Interactions"
            value={dashboardData.interactions.total}
            changePercentage={dashboardData.interactions.changePercentage}
            bgColor="bg-yellow-50"
          />
          
          <DashboardStatCard
            title="Trainings"
            value={dashboardData.trainings.total}
            changePercentage={dashboardData.trainings.changePercentage}
            bgColor="bg-blue-50"
          />
          
          <DashboardStatCard
            title="Administration"
            value={dashboardData.administration.total}
            changePercentage={dashboardData.administration.changePercentage}
            bgColor="bg-red-50"
          />
        </div>
        
        {/* Activity Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ActivityChartCard
            title={dashboardData.activityCharts.database.title}
            subtitle={dashboardData.activityCharts.database.subtitle}
            value={dashboardData.activityCharts.database.value}
            data={dashboardData.activityCharts.database.data}
            icon={<Database size={18} />}
          />
          
          <ActivityChartCard
            title={dashboardData.activityCharts.auth.title}
            subtitle={dashboardData.activityCharts.auth.subtitle}
            value={dashboardData.activityCharts.auth.value}
            data={dashboardData.activityCharts.auth.data}
            icon={<KeyRound size={18} />}
          />
          
          <ActivityChartCard
            title={dashboardData.activityCharts.storage.title}
            subtitle={dashboardData.activityCharts.storage.subtitle}
            value={dashboardData.activityCharts.storage.value}
            data={dashboardData.activityCharts.storage.data}
            icon={<HardDrive size={18} />}
          />
          
          <ActivityChartCard
            title={dashboardData.activityCharts.realtime.title}
            subtitle={dashboardData.activityCharts.realtime.subtitle}
            value={dashboardData.activityCharts.realtime.value}
            data={dashboardData.activityCharts.realtime.data}
            icon={<Zap size={18} />}
          />
        </div>
        
        {/* Action Buttons at the bottom left */}
        <div className="flex justify-start mt-6">
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/clients')}
            >
              View All Clients
            </Button>
            <Button onClick={() => navigate('/admin/clients/new')}>
              Add Client
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
