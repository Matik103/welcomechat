
import React, { useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  
  useEffect(() => {
    setupRealtimeActivities().then(success => {
      if (success) {
        console.log('Realtime subscriptions set up successfully');
      } else {
        console.error('Failed to set up realtime subscriptions');
      }
    });
    
    fetchDashboardData();
    
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
        fetchDashboardData();
      })
      .subscribe();
      
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []);
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {!isLoading && (
          <>
            <StatsCardsSection dashboardData={dashboardData} />
            <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
