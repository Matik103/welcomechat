
import React, { useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { setupRealtimeActivities } from '@/utils/setupRealtimeActivities';
import { subscribeToAllActivities } from '@/services/activitySubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { StatsCardsSection } from '@/components/admin/dashboard/StatsCardsSection';
import { ActivityChartsSection } from '@/components/admin/dashboard/ActivityChartsSection';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRecentActivities } from '@/hooks/useRecentActivities';

export default function AdminDashboardPage() {
  const { isLoading, dashboardData, fetchDashboardData } = useAdminDashboardData();
  const { 
    activities, 
    isLoading: isActivitiesLoading 
  } = useRecentActivities();
  
  useEffect(() => {
    // Add error handling for real-time setup
    setupRealtimeActivities().then(success => {
      if (success) {
        console.log('Realtime subscriptions set up successfully');
      } else {
        console.error('Failed to set up realtime subscriptions');
      }
    }).catch(err => {
      console.error('Error setting up realtime activities:', err);
    });
    
    // Fetch dashboard data with error handling
    fetchDashboardData().catch(err => {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    });
    
    // Set up subscriptions with proper error handling
    let activitiesChannel;
    try {
      activitiesChannel = subscribeToAllActivities(() => {
        console.log('Activities changed, refreshing dashboard data');
        fetchDashboardData().catch(err => {
          console.error('Error refreshing dashboard data:', err);
        });
      });
    } catch (error) {
      console.error('Error subscribing to activities:', error);
    }
    
    let agentsChannel;
    try {
      agentsChannel = supabase.channel('public:ai_agents_dashboard')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
        }, () => {
          fetchDashboardData().catch(err => {
            console.error('Error refreshing dashboard data after agent change:', err);
          });
        })
        .subscribe();
    } catch (error) {
      console.error('Error subscribing to agents channel:', error);
    }
      
    const intervalId = setInterval(() => {
      fetchDashboardData().catch(err => {
        console.error('Error refreshing dashboard data on interval:', err);
      });
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      if (agentsChannel) supabase.removeChannel(agentsChannel);
      if (activitiesChannel) supabase.removeChannel(activitiesChannel);
    };
  }, [fetchDashboardData]);
  
  return (
    <AdminLayout>
      <div className="container py-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : dashboardData ? (
          <>
            <StatsCardsSection dashboardData={dashboardData} />
            <ActivityChartsSection activityCharts={dashboardData.activityCharts} />
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                <CardDescription>Latest actions across all clients</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivityList
                  activities={activities || []}
                  isLoading={isActivitiesLoading}
                  highlightedId={null}
                  onActivityClick={() => {}}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No dashboard data available</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
