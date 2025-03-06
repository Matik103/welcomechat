
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorLog, QueryItem } from "@/types/client-dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  
  // Set a timeout to ensure we don't get stuck in a loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);
  
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
    isLoadingStats,
    authError
  } = useClientDashboard(effectiveClientId);

  // Handle auth error
  useEffect(() => {
    if (authError) {
      toast.error("Your session has expired. Please sign in again.");
      // Give the toast time to display before signing out
      const timer = setTimeout(() => {
        signOut?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [authError, signOut]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show fallback UI if we've been loading for too long
  if ((isLoadingStats || isLoadingErrorLogs || isLoadingQueries) && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-6 space-y-8">
        {/* Refresh button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1 text-gray-600"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
        
        {/* Stats section - with increased top spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <InteractionStats 
            stats={stats} 
            isLoading={isLoadingStats && !loadTimeout} 
          />
        </div>

        {/* Recent data section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error logs card */}
          <ErrorLogList 
            logs={errorLogs as ErrorLog[]} 
            isLoading={isLoadingErrorLogs && !loadTimeout} 
          />

          {/* Common queries card */}
          <QueryList 
            queries={queries as QueryItem[]} 
            isLoading={isLoadingQueries && !loadTimeout} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
