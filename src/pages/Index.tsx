import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, Key, HardDrive, Zap, Brain, MessageSquare, BookOpen, Settings } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { SmallStat } from "@/components/dashboard/SmallStat";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ClientActivity } from "@/types/activity";
import { BarChart } from "@/components/dashboard/BarChart";

// Sample data for charts
const generateRandomData = (length: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

export default function Index() {
  const navigate = useNavigate();
  const [highlightedActivity, setHighlightedActivity] = useState<string | null>(null);
  
  const {
    activeUsers,
    interactionCount,
    avgResponseTime,
    commonQueries,
    totalClients,
    activeClients,
    activeClientsChange,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useAdminDashboard();
  
  const {
    activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useRecentActivities();

  // Sample chart data
  const chartData = {
    database: generateRandomData(24),
    auth: generateRandomData(24),
    storage: generateRandomData(24),
    realtime: generateRandomData(24)
  };

  const handleActivityClick = (id: string) => {
    setHighlightedActivity(id === highlightedActivity ? null : id);
  };

  const handleAddClientClick = () => {
    navigate('/admin/clients/new');
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchDashboard();
      refetchActivities();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetchDashboard, refetchActivities]);

  if (dashboardError || activitiesError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 dashboard-heading">Dashboard Error</h1>
        <p className="text-red-500 body-text">
          {dashboardError ? `Dashboard error: ${dashboardError.message}` : ''}
          {activitiesError ? `Activities error: ${activitiesError.message}` : ''}
        </p>
        <Button 
          onClick={() => {
            refetchDashboard();
            refetchActivities();
          }}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Clients Card */}
        <div 
          onClick={() => handleCardClick('/admin/clients')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Clients</h3>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-blue-100">Manage client accounts and settings</p>
          </Card>
        </div>

        {/* Agents Card */}
        <div 
          onClick={() => handleCardClick('/admin/agents')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Agents</h3>
                <p className="text-2xl font-bold">{activeClients}</p>
              </div>
              <div className="bg-purple-400 p-3 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <p className="text-purple-100">View and manage AI agents</p>
          </Card>
        </div>

        {/* Interactions Card */}
        <div className="cursor-not-allowed opacity-75">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Interactions</h3>
                <p className="text-2xl font-bold">{interactionCount}</p>
              </div>
              <div className="bg-green-400 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <p className="text-green-100">Coming soon: View all interactions</p>
          </Card>
        </div>

        {/* Trainings Card */}
        <div className="cursor-not-allowed opacity-75">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Trainings</h3>
                <p className="text-2xl font-bold">{activeClients}</p>
              </div>
              <div className="bg-orange-400 p-3 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <p className="text-orange-100">Coming soon: View all training materials</p>
          </Card>
        </div>

        {/* Administration Card */}
        <div 
          onClick={() => handleCardClick('/admin/settings')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Administration</h3>
                <p className="text-2xl font-bold">{activeClients}</p>
              </div>
              <div className="bg-pink-400 p-3 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
            </div>
            <p className="text-pink-100">Manage system settings and configurations</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-sm font-medium text-slate-900">Clients</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] w-full">
              <BarChart data={chartData.database} color="#22C55E" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <CardTitle className="text-sm font-medium text-slate-900">Agents</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] w-full">
              <BarChart data={chartData.auth} color="#6B7280" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              <div>
                <CardTitle className="text-sm font-medium text-slate-900">Interactions</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] w-full">
              <BarChart data={chartData.storage} color="#EAB308" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-sm font-medium text-slate-900">Trainings</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] w-full">
              <BarChart data={chartData.realtime} color="#3B82F6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-pink-600" />
              <div>
                <CardTitle className="text-sm font-medium text-slate-900">Administration</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[80px] w-full">
              <BarChart data={chartData.realtime} color="#EC4899" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="subheading-text">Recent Activity</CardTitle>
          <CardDescription>Latest actions across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityList
            activities={activities as ClientActivity[]}
            isLoading={isActivitiesLoading}
            highlightedId={highlightedActivity}
            onActivityClick={handleActivityClick}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-start mt-6">
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/clients')}
          >
            View All Clients
          </Button>
          <Button onClick={handleAddClientClick}>
            Add Client
          </Button>
        </div>
      </div>
    </div>
  );
}
