import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ClientActivity } from "@/types/activity";
import { NewActionButtons } from "@/components/dashboard/NewActionButtons";
import { StatsCardsSection } from "@/components/admin/dashboard/StatsCardsSection";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import { ActivityChartsSection } from "@/components/admin/dashboard/ActivityChartsSection";

export default function Index() {
  const navigate = useNavigate();
  const [highlightedActivity, setHighlightedActivity] = useState<string | null>(null);
  
  const {
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useAdminDashboard();

  const { isLoading: isDashboardDataLoading, dashboardData } = useAdminDashboardData();
  
  const {
    activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useRecentActivities();

  const handleActivityClick = (id: string) => {
    setHighlightedActivity(id === highlightedActivity ? null : id);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchDashboard();
      refetchActivities();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetchDashboard, refetchActivities]);

  const isLoading = isDashboardLoading || isDashboardDataLoading || isActivitiesLoading;

  if (dashboardError || activitiesError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
        <p className="text-red-500">
          {dashboardError ? `Dashboard error: ${dashboardError.message}` : ''}
          {activitiesError ? `Activities error: ${activitiesError.message}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Dashboard content */}
          <div className="mb-8">
            <NewActionButtons />
          </div>
          
          {/* Stats Cards */}
          {dashboardData && <StatsCardsSection dashboardData={dashboardData} />}
          
          {/* Activity Charts */}
          {dashboardData && <ActivityChartsSection activityCharts={dashboardData.activityCharts} />}
          
          <Card className="mt-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="border-b pb-3">
                      <p className="font-medium">{activity.description || "No description"}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No recent activities found</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
