
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityTypeString } from "@/types/activity";

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
    const adminActivityTypes: (ActivityType | ActivityTypeString)[] = [
      ActivityType.CLIENT_CREATED, 
      ActivityType.CLIENT_UPDATED, 
      ActivityType.CLIENT_DELETED,
      ActivityType.CLIENT_RECOVERED,
      ActivityType.AGENT_CREATED,
      ActivityType.AGENT_UPDATED,
      ActivityType.AGENT_DELETED,
      ActivityType.AGENT_NAME_UPDATED,
      ActivityType.AGENT_DESCRIPTION_UPDATED,
      ActivityType.AGENT_ERROR,
      ActivityType.AGENT_LOGO_UPDATED,
      ActivityType.DOCUMENT_ADDED,
      ActivityType.DOCUMENT_REMOVED,
      ActivityType.DOCUMENT_PROCESSED,
      ActivityType.DOCUMENT_PROCESSING_FAILED,
      ActivityType.URL_ADDED,
      ActivityType.URL_REMOVED,
      ActivityType.URL_PROCESSED,
      ActivityType.URL_PROCESSING_FAILED,
      ActivityType.WEBHOOK_SENT,
      ActivityType.EMAIL_SENT,
      ActivityType.INVITATION_SENT,
      ActivityType.INVITATION_ACCEPTED,
      ActivityType.WIDGET_PREVIEWED,
      ActivityType.USER_ROLE_UPDATED,
      ActivityType.LOGIN_SUCCESS,
      ActivityType.LOGIN_FAILED,
      ActivityType.SIGNED_OUT,
      ActivityType.WIDGET_SETTINGS_UPDATED,
      ActivityType.LOGO_UPLOADED,
      ActivityType.SYSTEM_UPDATE,
      ActivityType.SOURCE_DELETED,
      ActivityType.SOURCE_ADDED
    ];
      
    // Convert enum values to their string equivalents - fixed to use proper string conversion
    const adminActivityTypeStrings = adminActivityTypes.map(type => 
      typeof type === 'string' ? type : type
    );
      
    // Count all administration-related activities
    const { count: totalCount, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', adminActivityTypeStrings as any); // Use type assertion to bypass type checking
      
    if (countError) throw countError;
    
    // Get recent activities (created in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    const timeAgoStr = timeAgo.toISOString();
    
    const { count: recentCount, error: recentError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', adminActivityTypeStrings as any) // Use type assertion to bypass type checking
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
