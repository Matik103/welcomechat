
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
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  
  // Memoize the manual refresh handler to prevent unnecessary re-renders
  const handleManualRefresh = useCallback(async () => {
    try {
      setIsManuallyRefreshing(true);
      await fetchDashboardData(true);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setTimeout(() => {
        setIsManuallyRefreshing(false);
      }, 500); // Show loading state for at least 500ms for better UX
    }
  }, [fetchDashboardData]);
  
  // Memoize the dashboard content to prevent unnecessary re-renders
  const dashboardContent = useMemo(() => {
    if (isLoading && !isManuallyRefreshing) {
      return <DashboardLoading />;
    }
    
    return (
      <>
        <StatsCardsSection dashboardData={dashboardData} />
        <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
      </>
    );
  }, [isLoading, isManuallyRefreshing, dashboardData]);
  
  useEffect(() => {
    console.log("AdminDashboard mounted, initializing...");
    let activitiesChannel: any = null;
    let agentsChannel: any = null;
    
    const initializeDashboard = async () => {
      try {
        console.log("Setting up realtime activities...");
        // Setup realtime channels for activities
        const success = await setupRealtimeActivities();
        if (!success) {
          console.warn('Failed to set up realtime subscriptions, will use polling fallback');
        }
        
        console.log("Subscribing to activities...");
        // Subscribe to all activities
        activitiesChannel = subscribeToAllActivities((payload) => {
          console.log('Activities changed:', payload);
          // Only refresh if we received a meaningful change
          if (payload && payload.new) {
            console.log('Refreshing dashboard data due to activity change');
            fetchDashboardData();
          }
        });
        
        console.log("Setting up agent change subscription...");
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
        
        console.log("Initialization complete, fetching initial data...");
        // Fetch initial data
        await fetchDashboardData(true);
        setIsSetupComplete(true);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize dashboard'));
        setIsSetupComplete(true); // Mark setup as complete even on error to show error state
      }
    };
    
    initializeDashboard();
    
    // Cleanup function
    return () => {
      console.log("AdminDashboard unmounting, cleaning up subscriptions...");
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
      if (agentsChannel) supabase.removeChannel(agentsChannel);
    };
  }, [fetchDashboardData]);
  
  // Show loading state while setup is in progress
  if (!isSetupComplete) {
    console.log("Setup not complete, showing loading state");
    return (
      <AdminLayout>
        <DashboardLoading message="Initializing dashboard..." />
      </AdminLayout>
    );
  }
  
  // Show error state if there was an error
  if (error) {
    console.log("Error state:", error.message);
    return (
      <AdminLayout>
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchDashboardData(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  console.log("Rendering dashboard content, isLoading:", isLoading);
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        <DashboardHeader
          isRefreshing={isLoading || isManuallyRefreshing}
          onRefresh={handleManualRefresh}
        />
        
        {dashboardContent}
      </div>
    </AdminLayout>
  );
}
