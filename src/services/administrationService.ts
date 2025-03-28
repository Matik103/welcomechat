
import { supabase } from "@/integrations/supabase/client";

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
    // Count all administration-related activities
    const { count: totalCount, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', [
        'client_created', 
        'client_updated', 
        'client_deleted',
        'agent_created',
        'agent_updated',
        'agent_deleted',
        'document_added',
        'document_removed',
        'url_added',
        'url_removed'
      ]);
      
    if (countError) throw countError;
    
    // Get recent activities (created in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    const timeAgoStr = timeAgo.toISOString();
    
    const { count: recentCount, error: recentError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .in('type', [
        'client_created', 
        'client_updated', 
        'client_deleted',
        'agent_created',
        'agent_updated',
        'agent_deleted',
        'document_added',
        'document_removed',
        'url_added',
        'url_removed'
      ])
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
