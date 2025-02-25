
import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { useClientStats } from "@/hooks/useClientStats";
import { useInteractionStats } from "@/hooks/useInteractionStats";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");
  
  const { 
    data: clientStats,
    isError: isClientStatsError,
    isLoading: isClientStatsLoading 
  } = useClientStats();
  
  const { 
    data: interactionStats,
    isError: isInteractionStatsError,
    isLoading: isInteractionStatsLoading 
  } = useInteractionStats(timeRange);
  
  const { 
    data: recentActivities,
    isError: isActivitiesError,
    isLoading: isActivitiesLoading 
  } = useRecentActivities();

  // Show error toasts only once when errors occur
  if (isClientStatsError || isInteractionStatsError || isActivitiesError) {
    toast.error("Error loading dashboard data. Please try again later.");
  }

  const isLoading = isClientStatsLoading || isInteractionStatsLoading || isActivitiesLoading;

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
                title="Total Clients" 
                value={clientStats?.totalClients || 0}
              />
              <MetricCard 
                title="Active Clients" 
                value={clientStats?.activeClients || 0}
                change={clientStats?.activeClientsChange}
              />
              <MetricCard 
                title="Avg. Interactions" 
                value={interactionStats?.avgInteractions || 0}
                change={interactionStats?.avgInteractionsChange}
              />
              <MetricCard 
                title="Total Interactions" 
                value={interactionStats?.totalInteractions || 0}
              />
            </div>

            <ActivityList activities={recentActivities || []} />
            <ActionButtons />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
