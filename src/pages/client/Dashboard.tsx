
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/client-dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/client-dashboard/DashboardLoading";
import { DashboardContent } from "@/components/client-dashboard/DashboardContent";
import { QueryItem } from "@/types/client-dashboard";
import { ClientLayout } from "@/components/layout/ClientLayout";

export interface ClientDashboardProps {
  clientId?: string;
}

const ClientDashboard = ({ clientId }: ClientDashboardProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Set a short timeout to prevent getting stuck in loading state
  useEffect(() => {
    if (firstLoadComplete) return;
    
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
      setFirstLoadComplete(true);
    }, 1000); // Short timeout to prevent loading screen from getting stuck
    
    return () => clearTimeout(timeout);
  }, [firstLoadComplete]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user && loadTimeout) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate, loadTimeout]);

  // Get client ID from user metadata if not provided
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

  // Debug logs to help troubleshoot loading issue
  useEffect(() => {
    console.log("Dashboard loading state:", { 
      isLoading, 
      loadTimeout, 
      firstLoadComplete,
      user: !!user,
      clientId: effectiveClientId,
      stats: !!stats
    });
  }, [isLoading, loadTimeout, firstLoadComplete, user, effectiveClientId, stats]);

  // Only show loading state if we're actually loading and the page is visible
  const shouldShowLoading = useMemo(() => 
    isLoading && !loadTimeout && isPageVisible && !firstLoadComplete,
    [isLoading, loadTimeout, isPageVisible, firstLoadComplete]
  );

  // Convert stats to the expected format for the InteractionStats component
  const formattedStats = useMemo(() => stats ? {
    // Snake case versions
    total_interactions: stats.total_interactions,
    active_days: stats.active_days,
    average_response_time: stats.average_response_time,
    top_queries: stats.top_queries,
    
    // CamelCase versions required by InteractionStats type
    totalInteractions: stats.totalInteractions || stats.total_interactions,
    activeDays: stats.activeDays || stats.active_days,
    averageResponseTime: stats.averageResponseTime || stats.average_response_time,
    topQueries: stats.topQueries || stats.top_queries
  } : {
    // Default values with both naming conventions
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    top_queries: [],
    
    totalInteractions: 0,
    activeDays: 0,
    averageResponseTime: 0,
    topQueries: []
  }, [stats]);

  // Format top queries for the QueryList component
  const queries = useMemo(() => stats?.topQueries?.map(q => ({
    id: `query-${Math.random().toString(36).substr(2, 9)}`,
    query_text: q.query_text,
    frequency: q.frequency
  })) || [], [stats?.topQueries]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.location.reload();
    // This timeout is just for UI feedback, the page will reload before it completes
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Render content within ClientLayout to ensure header is displayed
  return (
    <ClientLayout>
      {shouldShowLoading ? (
        <DashboardLoading />
      ) : (
        <div className="bg-[#F8F9FA] min-h-screen">
          <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-6 space-y-8">
            {/* Refresh button */}
            <DashboardHeader 
              isRefreshing={isRefreshing} 
              onRefresh={handleRefresh} 
            />
            
            {/* Dashboard content */}
            <DashboardContent 
              stats={formattedStats}
              recentInteractions={recentInteractions}
              queries={queries}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </ClientLayout>
  );
};

export default ClientDashboard;
