
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
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-6 space-y-8">
        {/* Stats section - with increased top spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <InteractionStats stats={stats} />
        </div>

        {/* Recent data section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error logs card */}
          <ErrorLogList 
            logs={errorLogs as ErrorLog[]} 
            isLoading={isLoadingErrorLogs} 
          />

          {/* Common queries card */}
          <QueryList 
            queries={queries as QueryItem[]} 
            isLoading={isLoadingQueries} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
