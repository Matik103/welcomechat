
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";

/**
 * Get total count of administration activities across all clients
 * This includes client creation, updates, deletions and other admin actions
 */
export const getAdministrationActivitiesCount = async (): Promise<{ 
  total: number, 
  recent: number, 
  changePercentage: number 
}> => {
  try {
    // Define the activity types that are considered administration activities
    const adminActivityTypes = [
      'client_created', 
      'client_updated', 
      'client_deleted',
      'client_recovered',
      'agent_created',
      'agent_updated',
      'agent_deleted',
      'agent_name_updated',
      'agent_description_updated',
      'agent_error',
      'agent_logo_updated',
      'document_added',
      'document_removed',
      'document_processed',
      'document_processing_failed',
      'url_added',
      'url_removed',
      'url_processed',
      'url_processing_failed',
      'webhook_sent',
      'email_sent',
      'invitation_sent',
      'invitation_accepted',
      'widget_previewed',
      'user_role_updated',
      'login_success',
      'login_failed',
      'signed_out',
      'widget_settings_updated',
      'logo_uploaded',
      'system_update',
      'source_deleted',
      'source_added'
    ] as string[];
      
    // Count all administration-related activities
    const { count: totalCount, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', adminActivityTypes);
      
    if (countError) throw countError;
    
    // Get recent activities (created in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    const timeAgoStr = timeAgo.toISOString();
    
    const { count: recentCount, error: recentError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', adminActivityTypes)
      .gt('created_at', timeAgoStr);
      
    if (recentError) throw recentError;
    
    // Calculate change percentage
    const previousPeriodCount = totalCount - recentCount;
    let changePercentage = 0;
    
    if (previousPeriodCount > 0) {
      changePercentage = Math.round((recentCount / previousPeriodCount) * 100) / 5;
    }
    
    return {
      total: totalCount || 0,
      recent: recentCount || 0,
      changePercentage
    };
  } catch (error) {
    console.error("Error getting administration activities count:", error);
    return { total: 0, recent: 0, changePercentage: 0 };
  }
};
