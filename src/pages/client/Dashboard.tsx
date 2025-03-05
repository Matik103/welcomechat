
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { useClientActivity } from "@/hooks/useClientActivity";

const ClientDashboard = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { stats, errorLogs, queries, isLoadingErrorLogs, isLoadingQueries } = useClientDashboard(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  
  // Log dashboard visit activity when component mounts
  useEffect(() => {
    if (clientId) {
      logClientActivity(
        "dashboard_visited", 
        "visited their dashboard", 
        { timestamp: new Date().toISOString() }
      );
    }
  }, [clientId, logClientActivity]);

  if (isLoadingErrorLogs && isLoadingQueries) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Your Chatbot Dashboard</h1>
          <p className="text-gray-500">Monitor your AI chatbot's performance</p>
        </div>

        <InteractionStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QueryList queries={queries} isLoading={isLoadingQueries} />
          <ErrorLogList logs={errorLogs} isLoading={isLoadingErrorLogs} />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
