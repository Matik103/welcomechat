
import React from "react";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { Loader2 } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant Dashboard</h1>
        <p className="text-gray-500 mb-8">Monitor your AI assistant's performance and user interactions</p>
        
        <InteractionStats 
          interactionStats={interactionStats}
          isLoading={isLoadingStats}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QueryList 
            queries={commonQueries} 
            isLoading={isLoadingQueries} 
          />
          
          <ErrorLogList 
            logs={errorLogs} 
            isLoading={isLoadingErrors} 
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <ActivityList 
            activities={activities} 
            isLoading={isLoadingActivities} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
