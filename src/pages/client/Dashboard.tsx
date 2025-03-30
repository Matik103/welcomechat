import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/client-dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/client-dashboard/DashboardLoading";
import { DashboardContent } from "@/components/client-dashboard/DashboardContent";
import { QueryItem } from "@/types/client-dashboard";
import { ClientLayout } from '@/components/layout/ClientLayout';

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  
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

  const effectiveClientId = useMemo(() => 
    clientId || user?.user_metadata?.client_id, 
    [clientId, user?.user_metadata?.client_id]
  );
  
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

  if (shouldShowLoading) {
    return <DashboardLoading />;
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
