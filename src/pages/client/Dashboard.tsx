
import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { useClientStats } from "@/hooks/useClientStats";
import { useInteractionStats } from "@/hooks/useInteractionStats";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    data: clientStats,
    isLoading: clientStatsLoading 
  } = useClientStats();
  
  const { 
    data: interactionStats,
    isLoading: interactionStatsLoading 
  } = useInteractionStats(timeRange);
  
  const { 
    data: recentActivities,
    isLoading: activitiesLoading 
  } = useRecentActivities();

  // If still loading auth, show loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated after loading, redirect to auth page
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  const isLoading = clientStatsLoading || interactionStatsLoading || activitiesLoading;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Dashboard</h1>
          <p className="text-gray-500">Monitor your AI chatbot performance</p>
        </div>

        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            {(["1d", "1m", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === range
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } transition-colors duration-200`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Interactions" 
                value={interactionStats?.totalInteractions || 0}
              />
              <MetricCard 
                title="Avg. Interactions" 
                value={interactionStats?.avgInteractions || 0}
                change={interactionStats?.avgInteractionsChange}
              />
              <MetricCard 
                title="Active Sessions" 
                value={clientStats?.activeClients || 0}
                change={clientStats?.activeClientsChange}
              />
              <MetricCard 
                title="Response Rate" 
                value={`${clientStats?.responseRate || 0}%`}
              />
            </div>

            <ActivityList activities={recentActivities} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
