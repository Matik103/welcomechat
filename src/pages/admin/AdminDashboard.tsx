
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let activitiesChannel: any = null;
    let agentsChannel: any = null;
    let intervalId: any = null;
    
    const initializeDashboard = async () => {
      try {
        // Setup realtime channels for activities
        const success = await setupRealtimeActivities();
        if (!success) {
          console.warn('Failed to set up realtime subscriptions, will use polling fallback');
        }
        
        // Initial data fetch
        await fetchDashboardData();
        
        // Subscribe to all activities
        activitiesChannel = subscribeToAllActivities(() => {
          console.log('Activities changed, refreshing dashboard data');
          fetchDashboardData().catch(err => console.error('Error refreshing data:', err));
        });
        
        // Subscribe to agent changes
        agentsChannel = supabase.channel('public:ai_agents_dashboard')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'ai_agents',
          }, () => {
            fetchDashboardData().catch(err => console.error('Error refreshing data:', err));
          })
          .subscribe();
        
        // Set up polling as a fallback
        intervalId = setInterval(() => {
          fetchDashboardData().catch(err => console.error('Error in interval refresh:', err));
        }, 5 * 60 * 1000);
        
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
      if (intervalId) clearInterval(intervalId);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
      if (agentsChannel) supabase.removeChannel(agentsChannel);
    };
  }, []);
  
  // Show loading state while setup is in progress
  if (!isSetupComplete) {
    return (
      <AdminLayout>
        <div className="container py-8 flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Initializing dashboard...</p>
          </div>
        </div>
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
            <button 
              onClick={() => {
                setError(null);
                fetchDashboardData();
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
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StatsCardsSection dashboardData={dashboardData} />
            <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
