
import React, { useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const success = await setupRealtimeActivities();
        if (success) {
          console.log('Realtime subscriptions set up successfully');
        } else {
          console.error('Failed to set up realtime subscriptions');
          toast.error('Failed to set up real-time updates');
        }
        
        // Fetch initial dashboard data
        fetchDashboardData();
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        toast.error('Error initializing dashboard');
      }
    };
    
    initializeDashboard();
    
    // Set up event subscriptions for real-time updates
    const activitiesChannel = subscribeToAllActivities(() => {
      console.log('Activities changed, refreshing dashboard data');
      fetchDashboardData();
    });
    
    const agentsChannel = supabase.channel('public:ai_agents_dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agents',
      }, () => {
        console.log('Agents changed, refreshing dashboard data');
        fetchDashboardData();
      })
      .subscribe();
      
    // Refresh data every 5 minutes
    const intervalId = setInterval(() => {
      console.log('Refreshing dashboard data (interval)');
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [fetchDashboardData]);
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <span className="text-lg text-gray-600">Loading dashboard data...</span>
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
