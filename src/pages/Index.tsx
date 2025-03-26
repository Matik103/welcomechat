import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, Key, HardDrive, Zap } from "lucide-react";
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
    <div className="container mx-auto p-6">
      {isDashboardLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card className="bg-green-50 hover:bg-green-100 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">CLIENTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">12</div>
                <div className="text-sm text-muted-foreground">10 Active +18%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 hover:bg-gray-200 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">AGENTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">18</div>
                <div className="text-sm text-muted-foreground">10 Active +18%</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">INTERACTIONS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">1,234</div>
                <div className="text-sm text-muted-foreground">+18%</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 hover:bg-blue-100 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">TRAININGS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">484</div>
                <div className="text-sm text-muted-foreground">+18%</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 hover:bg-red-100 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">ADMINISTRATION</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">123</div>
                <div className="text-sm text-muted-foreground">+18%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Clients</CardTitle>
                    <CardDescription className="text-green-600">Activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.database} color="#22C55E" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Agents</CardTitle>
                    <CardDescription className="text-gray-600">Activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.auth} color="#6B7280" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-yellow-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Interactions</CardTitle>
                    <CardDescription className="text-yellow-600">Activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.storage} color="#EAB308" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Trainings</CardTitle>
                    <CardDescription className="text-blue-600">Activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.realtime} color="#3B82F6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Administration</CardTitle>
                    <CardDescription className="text-red-600">Activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.realtime} color="#EF4444" />
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
        </>
      )}
    </div>
  );
}
