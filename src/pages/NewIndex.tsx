import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ActivityType, ActivityTypeString, ClientActivity } from "@/types/activity";
import { NewActionButtons } from "@/components/dashboard/NewActionButtons";

export default function NewIndex() {
  const navigate = useNavigate();
  const [highlightedActivity, setHighlightedActivity] = useState<string | null>(null);
  
  const {
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
      {isDashboardLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Dashboard content from the original Dashboard component */}
          <div className="mb-8">
            <NewActionButtons />
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {/* Content for your activity list */}
              <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
              {/* Add your activity list component here */}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
