import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Clock } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { SmallStat } from "@/components/dashboard/SmallStat";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ClientActivity } from "@/types/activity";

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
      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleAddClientClick}>
          Add Client
        </Button>
      </div>

      {isDashboardLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <SmallStat
              title="Active Users"
              value={activeUsers}
              icon={<Users className="h-6 w-6" />}
              description="Users active today"
              colorClass="text-blue-500 bg-blue-50"
            />
            <SmallStat
              title="Clients"
              value={totalClients}
              icon={<Users className="h-6 w-6" />}
              description={`${activeClients} active clients`}
              colorClass="text-green-500 bg-green-50"
            />
            <SmallStat
              title="Daily Interactions"
              value={interactionCount}
              icon={<Activity className="h-6 w-6" />}
              description="User queries today"
              colorClass="text-purple-500 bg-purple-50"
            />
            <SmallStat
              title="Response Time"
              value={`${avgResponseTime.toFixed(2)}s`}
              icon={<Clock className="h-6 w-6" />}
              description="Average response time"
              colorClass="text-amber-500 bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ChartCard title="User Activity" data={commonQueries} className="h-full" />
            </div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="subheading-text">Client Growth</CardTitle>
                <CardDescription>New clients and activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4 text-center">
                  <div>
                    <div className="text-5xl font-bold mb-2 stat-value">{activeClients}</div>
                    <div className="text-sm text-muted-foreground stat-label">Active Clients</div>
                    <div className="mt-2 text-sm text-green-500">
                      +{activeClientsChange.toFixed(0)}% from last month
                    </div>
                  </div>
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
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/clients')}
              >
                View All Clients
              </Button>
              <Button 
                onClick={handleAddClientClick}
              >
                Add Client
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
