
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';
import { DashboardHeader } from '@/components/client-dashboard/DashboardHeader';
import { DashboardLoading } from '@/components/client-dashboard/DashboardLoading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  
  // Set a timeout to show content even if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadTimeout(true);
      }
    }, 3000); // Show fallback content after 3 seconds
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Memoize the manual refresh handler to prevent unnecessary re-renders
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManuallyRefreshing(true);
      setError(null);
      await fetchDashboardData(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh data'));
    } finally {
      setTimeout(() => {
        setIsManuallyRefreshing(false);
      }, 500); // Show loading state for at least 500ms for better UX
    }
  }, [fetchDashboardData]);
  
  // Memoize the dashboard content to prevent unnecessary re-renders
  const dashboardContent = useMemo(() => {
    // If we're loading for too long, show partial content
    if (isLoading && !loadTimeout) {
      return <DashboardLoading message="Loading dashboard data..." />;
    }
    
    return (
      <>
        <StatsCardsSection dashboardData={dashboardData} />
        <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
      </>
    );
  }, [isLoading, loadTimeout, dashboardData]);
  
  useEffect(() => {
    let activitiesChannel: any = null;
    let agentsChannel: any = null;
    let initialSetupComplete = false;
    
    const initializeDashboard = async () => {
      if (initialSetupComplete) return;
      initialSetupComplete = true;
      
      try {
        // Setup realtime channels for activities
        const success = await setupRealtimeActivities();
        if (!success) {
          console.warn('Failed to set up realtime subscriptions, will use polling fallback');
        }
        
        // Subscribe to all activities
        activitiesChannel = subscribeToAllActivities((payload) => {
          console.log('Activities changed:', payload);
          // Only refresh if we received a meaningful change
          if (payload && payload.new) {
            console.log('Refreshing dashboard data due to activity change');
            fetchDashboardData();
          }
        });
        
        // Subscribe to agent changes
        agentsChannel = supabase.channel('public:ai_agents_dashboard')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'ai_agents',
          }, (payload) => {
            console.log('Agent changed:', payload);
            // Only refresh if we received a meaningful change
            if (payload && payload.new) {
              console.log('Refreshing dashboard data due to agent change');
              fetchDashboardData();
            }
          })
          .subscribe();
        
        setIsSetupComplete(true);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize dashboard'));
        setIsSetupComplete(true); // Mark setup as complete even on error to show error state
      }
    };
    
    initializeDashboard();
    
    // Set a timeout to fetch data if it takes too long
    const timeoutId = setTimeout(() => {
      if (!isSetupComplete) {
        setIsSetupComplete(true);
        fetchDashboardData(true);
      }
    }, 2000); // 2 seconds timeout
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
      if (agentsChannel) supabase.removeChannel(agentsChannel);
    };
  }, [fetchDashboardData]);
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            disabled={isManuallyRefreshing}
            className="ml-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isManuallyRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              <span>Error loading dashboard: {error.message}</span>
              <Button variant="outline" size="sm" onClick={() => {
                setError(null);
                fetchDashboardData(true);
              }}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show partial content if loading for more than timeout duration */}
        {(isLoading && !loadTimeout) ? (
          <DashboardLoading message="Loading dashboard data..." />
        ) : (
          <>
            <StatsCardsSection dashboardData={dashboardData} />
            <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
          </>
        )}
        
        {loadTimeout && isLoading && (
          <div className="mt-4 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-sm">
            Taking longer than usual to load... showing partial data.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
