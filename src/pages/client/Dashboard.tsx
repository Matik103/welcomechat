
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/client-dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/client-dashboard/DashboardLoading";
import { DashboardContent } from "@/components/client-dashboard/DashboardContent";
import { ClientLayout } from '@/components/layout/ClientLayout';
import { toast } from "sonner";
import { checkAndRefreshAuth } from "@/services/authService";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Check auth status on component mount
    const verifyAuth = async () => {
      const isValid = await checkAndRefreshAuth();
      setAuthChecked(true);
      if (!isValid) {
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth", { replace: true });
      }
    };
    
    verifyAuth();
  }, [navigate]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  useEffect(() => {
    if (firstLoadComplete) return;
    
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
      setFirstLoadComplete(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [firstLoadComplete]);
  
  useEffect(() => {
    if (!user && loadTimeout) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate, loadTimeout]);

  const effectiveClientId = useMemo(() => {
    console.log("Getting effective client ID:", { 
      providedClientId: clientId, 
      userMetadataClientId: user?.user_metadata?.client_id
    });
    return clientId || user?.user_metadata?.client_id;
  }, [clientId, user?.user_metadata?.client_id]);
  
  useEffect(() => {
    console.log("Effective client ID in Dashboard:", effectiveClientId);
  }, [effectiveClientId]);
  
  const {
    stats,
    chatHistory,
    recentInteractions,
    isLoading,
    agentName
  } = useClientDashboard(effectiveClientId || '', user?.user_metadata?.agent_name || 'AI Assistant');

  const shouldShowLoading = useMemo(() => 
    isLoading && !loadTimeout && isPageVisible && !firstLoadComplete,
    [isLoading, loadTimeout, isPageVisible, firstLoadComplete]
  );

  const formattedStats = useMemo(() => stats ? {
    total_interactions: stats.total_interactions,
    active_days: stats.active_days,
    average_response_time: stats.average_response_time,
    top_queries: stats.top_queries,
    
    totalInteractions: stats.totalInteractions || stats.total_interactions,
    activeDays: stats.activeDays || stats.active_days,
    averageResponseTime: stats.averageResponseTime || stats.average_response_time,
    topQueries: stats.topQueries || stats.top_queries
  } : {
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: [],
    
    totalInteractions: 0,
    activeDays: 0,
    averageResponseTime: 0,
    topQueries: []
  }, [stats]);

  const queries = useMemo(() => stats?.topQueries?.map(q => ({
    id: `query-${Math.random().toString(36).substr(2, 9)}`,
    query_text: q.query_text,
    frequency: q.frequency
  })) || [], [stats?.topQueries]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.location.reload();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  if (!authChecked || shouldShowLoading) {
    return <DashboardLoading />;
  }

  if (!effectiveClientId) {
    return (
      <ClientLayout>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-6">
          <div className="p-8 bg-red-50 border border-red-200 rounded-md text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Client ID Not Found</h3>
            <p className="text-red-600 mb-4">Unable to find client ID in your profile. Please make sure you're properly logged in.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-6 space-y-8">
        <DashboardHeader 
          isRefreshing={isRefreshing} 
          onRefresh={handleRefresh} 
        />
        
        <DashboardContent 
          stats={formattedStats}
          recentInteractions={recentInteractions}
          queries={queries}
          isLoading={shouldShowLoading}
        />
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
