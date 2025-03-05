
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { useClientStats } from "@/hooks/useClientStats";
import { useInteractionStats } from "@/hooks/useInteractionStats";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { toast } from "sonner";
import { setupRealtimeActivities } from "@/utils/setupRealtimeActivities";

const Index = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");
  
  // Set up real-time functionality on component mount
  useEffect(() => {
    const setup = async () => {
      try {
        await setupRealtimeActivities();
      } catch (error) {
        console.error("Failed to set up realtime activities:", error);
      }
    };
    
    setup();
  }, []);
  
  // Static stats that don't depend on time range
  const { 
    data: clientStats,
    isError: isClientStatsError,
    isLoading: isClientStatsLoading 
  } = useClientStats();
  
  // Dynamic stats that depend on time range
  const { 
    data: interactionStats,
    isError: isInteractionStatsError,
    isLoading: isInteractionStatsLoading 
  } = useInteractionStats(timeRange);
  
  const { 
    activities: recentActivities,
    isError: isActivitiesError,
    isLoading: isActivitiesLoading 
  } = useRecentActivities();

  // Show error toasts only once when errors occur
  if (isClientStatsError || isInteractionStatsError || isActivitiesError) {
    toast.error("Error loading dashboard data. Please try again later.");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">AI Chatbot Admin System</h1>
          <p className="text-gray-500">Monitor and manage your AI chatbot clients</p>
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
                disabled={isInteractionStatsLoading}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Static metrics that don't depend on time range */}
          <MetricCard 
            title="Total Clients" 
            value={clientStats?.totalClients || 0}
            isLoading={isClientStatsLoading}
          />
          <MetricCard 
            title="Active Clients" 
            value={clientStats?.activeClients || 0}
            change={clientStats?.activeClientsChange}
            isLoading={isClientStatsLoading}
          />
          {/* Dynamic metrics that update with time range */}
          <MetricCard 
            title="Avg. Interactions" 
            value={interactionStats?.avgInteractions || 0}
            change={interactionStats?.avgInteractionsChange}
            isLoading={isInteractionStatsLoading}
          />
          <MetricCard 
            title="Total Interactions" 
            value={interactionStats?.totalInteractions || 0}
            isLoading={isInteractionStatsLoading}
          />
        </div>

        <ActivityList 
          activities={recentActivities || []} 
          isLoading={isActivitiesLoading}
        />
        <ActionButtons />
      </div>
    </div>
  );
};

export default Index;
