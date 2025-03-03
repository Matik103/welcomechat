
import React from "react";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/client-dashboard/DashboardHeader";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { InsightsSection } from "@/components/client-dashboard/InsightsSection";
import { ActivitySection } from "@/components/client-dashboard/ActivitySection";

const ClientDashboard = () => {
  const { 
    clientId,
    interactionStats,
    isLoadingStats,
    commonQueries,
    isLoadingQueries,
    errorLogs,
    isLoadingErrors,
    activities,
    isLoadingActivities
  } = useClientDashboard();

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading client information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader 
          title="AI Assistant Dashboard" 
          subtitle="Monitor your AI assistant's performance and user interactions"
        />
        
        <InteractionStats 
          interactionStats={interactionStats || { total: 0, successRate: 0, averagePerDay: 0 }}
          isLoading={isLoadingStats}
        />
        
        <InsightsSection 
          queries={commonQueries} 
          isLoadingQueries={isLoadingQueries}
          errorLogs={errorLogs}
          isLoadingErrors={isLoadingErrors}
        />
        
        <ActivitySection 
          activities={activities}
          isLoading={isLoadingActivities}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;
