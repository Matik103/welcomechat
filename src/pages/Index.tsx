
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { ActionButtons } from "@/components/dashboard/ActionButtons";
import { VerifyIntegration } from "@/components/dashboard/VerifyIntegration";
import { useClientStats } from "@/hooks/useClientStats";
import { useInteractionStats } from "@/hooks/useInteractionStats";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { setupRealtimeActivities } from "@/utils/setupRealtimeActivities";
import { subscribeToAllActivities } from "@/services/activitySubscriptionService";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [timeRange, setTimeRange] = useState<"1d" | "1m" | "1y" | "all">("all");
  
  // Set up real-time functionality on component mount
  useEffect(() => {
    const setup = async () => {
      try {
        await setupRealtimeActivities();
        console.log("Realtime activities set up successfully");
      } catch (error) {
        console.error("Failed to set up realtime activities:", error);
      }
    };
    
    setup();
  }, []);

  // Set up global activity tracking for the admin dashboard
  const { 
    data: recentActivities,
    isLoading: isActivitiesLoading,
    refetch: refetchActivities 
  } = useRecentActivities();
  
  useEffect(() => {
    // Subscribe to all client activities for real-time updates in the activity list
    const channel = subscribeToAllActivities(() => {
      console.log("Refreshing activity list due to new activity");
      refetchActivities();
    });
    
    return () => {
      if (channel) {
        console.log("Removing activity subscription channel");
        supabase.removeChannel(channel);
      }
    };
  }, [refetchActivities]);
  
  // Static stats that don't depend on time range
  const { 
    data: clientStats,
    isLoading: isClientStatsLoading 
  } = useClientStats();
  
  // Dynamic stats that depend on time range
  const { 
    data: interactionStats,
    isLoading: isInteractionStatsLoading 
  } = useInteractionStats(timeRange);

  // Log for debugging
  useEffect(() => {
    console.log("Dashboard data:", {
      clientStats,
      interactionStats,
      recentActivities: recentActivities?.length
    });
  }, [clientStats, interactionStats, recentActivities]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">AI Chatbot Admin System</h1>
          <p className="text-gray-500">Monitor and manage your AI chatbot clients</p>
        </div>

        {/* Integration Verification Component */}
        <VerifyIntegration />

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
                {range === "1d" ? "1 DAY" :
                 range === "1m" ? "1 MONTH" :
                 range === "1y" ? "1 YEAR" : "ALL TIME"}
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
          activities={recentActivities} 
          isLoading={isActivitiesLoading}
        />
        <ActionButtons />
      </div>
    </div>
  );
};

export default Index;
