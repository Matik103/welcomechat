
import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';
import { DashboardHeader } from '@/components/client-dashboard/DashboardHeader';
import { DashboardLoading } from '@/components/client-dashboard/DashboardLoading';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupAttempted, setSetupAttempted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManuallyRefreshing(true);
      await fetchDashboardData(true);
    } catch (err) {
      console.error('Manual refresh error:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh dashboard'));
    } finally {
      setTimeout(() => {
        setIsManuallyRefreshing(false);
      }, 500); // Show loading state for at least 500ms for better UX
    }
  }, [fetchDashboardData]);
  
  useEffect(() => {
    let activitiesChannel: any = null;
    let agentsChannel: any = null;
    
    const initializeDashboard = async () => {
      if (setupAttempted) return;
      setSetupAttempted(true);
      
      try {
        console.log('Initializing dashboard...');
        
        // Setup realtime channels for activities
        const success = await setupRealtimeActivities();
        console.log('Realtime activities setup result:', success);
        
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
        
        // Force an initial data fetch
        await fetchDashboardData(true);
        
        setIsSetupComplete(true);
        console.log('Dashboard setup complete');
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize dashboard'));
        setIsSetupComplete(true); // Mark setup as complete even on error to show error state
      }
    };
    
    // Initialize on mount
    initializeDashboard();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up dashboard subscriptions');
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
      if (agentsChannel) supabase.removeChannel(agentsChannel);
    };
  }, [fetchDashboardData, setupAttempted]);
  
  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (!isSetupComplete && !error) {
      const timeoutId = setTimeout(() => {
        if (!isSetupComplete) {
          console.warn('Dashboard initialization timed out after 10 seconds');
          setError(new Error('Dashboard initialization timed out. Please try refreshing.'));
          setIsSetupComplete(true);
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [isSetupComplete, error]);
  
  // Retry function for errors
  const handleRetry = useCallback(() => {
    setError(null);
    setIsSetupComplete(false);
    setSetupAttempted(false);
    fetchDashboardData(true);
  }, [fetchDashboardData]);
  
  // Show loading state while setup is in progress and not timed out
  if (!isSetupComplete) {
    return (
      <AdminLayout>
        <DashboardLoading message="Initializing dashboard..." />
      </AdminLayout>
    );
  }
  
  // Show error state if there was an error
  if (error) {
    return (
      <AdminLayout>
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <Button 
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // If we've completed setup but dashboard data is still loading, show a better loading state
  if (isLoading && !isManuallyRefreshing && isSetupComplete) {
    return (
      <AdminLayout>
        <div className="container py-8 max-w-7xl mx-auto">
          <DashboardHeader
            isRefreshing={true}
            onRefresh={handleManualRefresh}
          />
          <DashboardLoading message="Loading dashboard data..." />
        </div>
      </AdminLayout>
    );
  }
  
  // Render the dashboard with data
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <DashboardHeader
          isRefreshing={isLoading || isManuallyRefreshing}
          onRefresh={handleManualRefresh}
        />
        
        {dashboardData ? (
          <>
            <StatsCardsSection dashboardData={dashboardData} />
            <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No dashboard data available</p>
            <Button onClick={handleManualRefresh} disabled={isManuallyRefreshing}>
              {isManuallyRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Refresh Data'
              )}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
