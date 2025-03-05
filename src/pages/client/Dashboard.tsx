
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorLog, QueryItem } from "@/hooks/useClientDashboard";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Get client ID from user metadata if not provided
  const effectiveClientId = clientId || user?.user_metadata?.client_id;
  
  const {
    stats,
    errorLogs,
    queries,
    isLoadingErrorLogs,
    isLoadingQueries,
  } = useClientDashboard(effectiveClientId);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <InteractionStats stats={stats} />
      </div>

      {/* Recent data section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error logs card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Error Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorLogList 
              logs={errorLogs as ErrorLog[]} 
              isLoading={isLoadingErrorLogs} 
            />
          </CardContent>
        </Card>

        {/* Common queries card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Common Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryList 
              queries={queries as QueryItem[]} 
              isLoading={isLoadingQueries} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
