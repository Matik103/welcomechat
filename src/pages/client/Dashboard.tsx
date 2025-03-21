import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QueryItem } from "@/types/client-dashboard";
import { Button } from "@/components/ui/button";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  useEffect(() => {
    if (!user && !loadTimeout) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate, loadTimeout]);

  const effectiveClientId = clientId || user?.user_metadata?.client_id;
  
  const {
    stats,
    chatHistory,
    recentInteractions,
    isLoading,
    agentName
  } = useClientDashboard(effectiveClientId || '', user?.user_metadata?.agent_name || 'AI Assistant');

  const formattedStats: any = stats ? {
    total_interactions: stats.totalInteractions,
    active_days: stats.activeDays,
    average_response_time: stats.averageResponseTime,
    top_queries: stats.topQueries
  } : {
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: []
  };

  const queries: QueryItem[] = stats?.topQueries?.map(q => ({
    id: `query-${Math.random().toString(36).substr(2, 9)}`,
    query_text: q.query_text,
    frequency: q.frequency
  })) || [];

  const refreshDashboard = useCallback(() => {
    window.location.reload();
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshDashboard();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refreshDashboard]);

  if (!user && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isInitialLoading = isLoading && !loadTimeout;

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-6 space-y-8">
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1 text-gray-600"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh</span>
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <InteractionStats 
            stats={formattedStats} 
            isLoading={isInitialLoading || isRefreshing} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isInitialLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : recentInteractions?.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No recent interactions found</p>
              ) : (
                <div className="space-y-4">
                  {recentInteractions.slice(0, 5).map((interaction) => (
                    <div key={interaction.id} className="border-b pb-3">
                      <p className="font-medium">{interaction.query_text}</p>
                      <p className="text-sm text-gray-500 mt-1">{new Date(interaction.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <QueryList 
            queries={queries} 
            isLoading={isInitialLoading || isRefreshing} 
            error={null} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
