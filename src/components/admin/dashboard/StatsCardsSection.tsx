
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Database, 
  MessagesSquare, 
  Lightbulb, 
  Settings 
} from 'lucide-react';
import { AdminStatCard } from './AdminStatCard';

interface StatsCardsSectionProps {
  dashboardData: {
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
  };
}

export function StatsCardsSection({ dashboardData }: StatsCardsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <AdminStatCard
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
      
      <AdminStatCard
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
      
      <AdminStatCard
        title="INTERACTIONS"
        value={dashboardData.interactions.total}
        changePercentage={dashboardData.interactions.changePercentage}
        bgColor="bg-[#FEF9C3]"
        chartData={dashboardData.interactions.chartData}
        chartColor="#CA8A04"
        icon={<MessagesSquare size={18} className="text-yellow-600" />}
        onClick={() => {}} // Not clickable for now
      />
      
      <AdminStatCard
        title="TRAININGS"
        value={dashboardData.trainings.total}
        changePercentage={dashboardData.trainings.changePercentage}
        bgColor="bg-[#EFF6FF]"
        chartData={dashboardData.trainings.chartData}
        chartColor="#2563EB"
        icon={<Lightbulb size={18} className="text-blue-600" />}
        onClick={() => {}} // Not clickable for now
      />
      
      <AdminStatCard
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
  );
}
