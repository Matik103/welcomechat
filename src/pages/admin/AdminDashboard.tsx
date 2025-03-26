import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStatCard } from '@/components/admin/DashboardStatCard';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Bot, 
  MessageSquare, 
  BookOpen,
  Settings,
  Activity
} from 'lucide-react';

// Mock data for the activity charts
const generateChartData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    name: `Day ${i + 1}`,
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
      changePercentage: 18,
      chartData: generateChartData()
    },
    agents: {
      total: 18,
      active: 15,
      changePercentage: 15,
      chartData: generateChartData()
    },
    interactions: {
      total: 1234,
      changePercentage: 18,
      chartData: generateChartData()
    },
    trainings: {
      total: 484,
      changePercentage: 12,
      chartData: generateChartData()
    },
    administration: {
      total: 123,
      changePercentage: 8,
      chartData: generateChartData()
    }
  };
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <DashboardStatCard
            title="Clients"
            value={dashboardData.clients.total}
            active={dashboardData.clients.active}
            changePercentage={dashboardData.clients.changePercentage}
            bgColor="bg-blue-50"
            chartColor="#3B82F6"
            onClick={() => navigate('/admin/clients')}
          />
          
          <DashboardStatCard
            title="Agents"
            value={dashboardData.agents.total}
            active={dashboardData.agents.active}
            changePercentage={dashboardData.agents.changePercentage}
            bgColor="bg-purple-50"
            chartColor="#8B5CF6"
            onClick={() => navigate('/admin/agents')}
          />
          
          <DashboardStatCard
            title="Interactions"
            value={dashboardData.interactions.total}
            changePercentage={dashboardData.interactions.changePercentage}
            bgColor="bg-green-50"
            chartColor="#10B981"
          />
          
          <DashboardStatCard
            title="Trainings"
            value={dashboardData.trainings.total}
            changePercentage={dashboardData.trainings.changePercentage}
            bgColor="bg-yellow-50"
            chartColor="#F59E0B"
          />
          
          <DashboardStatCard
            title="Administration"
            value={dashboardData.administration.total}
            changePercentage={dashboardData.administration.changePercentage}
            bgColor="bg-red-50"
            chartColor="#EF4444"
          />
        </div>
        
        {/* Activity Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActivityChartCard
            title="Client Activity"
            subtitle="Active clients over time"
            value={dashboardData.clients.active}
            data={dashboardData.clients.chartData}
            icon={<Users size={20} />}
            chartColor="#3B82F6"
          />
          
          <ActivityChartCard
            title="Agent Performance"
            subtitle="Agent interactions per day"
            value={dashboardData.agents.active}
            data={dashboardData.agents.chartData}
            icon={<Bot size={20} />}
            chartColor="#8B5CF6"
          />
          
          <ActivityChartCard
            title="Training Progress"
            subtitle="Documents processed"
            value={dashboardData.trainings.total}
            data={dashboardData.trainings.chartData}
            icon={<BookOpen size={20} />}
            chartColor="#F59E0B"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
