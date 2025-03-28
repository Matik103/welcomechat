
import { supabase } from "@/integrations/supabase/client";

/**
 * Get total count of training resources across all clients
 * This includes website URLs, document links, and Google Drive links
 */
export const getTrainingResourcesCount = async (): Promise<{ 
  total: number, 
  recent: number, 
  changePercentage: number 
}> => {
  try {
    // 1. Count website URLs
    const { count: websiteUrlsCount, error: websiteUrlsError } = await supabase
      .from('website_urls')
      .select('*', { count: 'exact', head: true });
      
    if (websiteUrlsError) throw websiteUrlsError;
    
    // 2. Count document links
    const { count: documentLinksCount, error: documentLinksError } = await supabase
      .from('document_links')
      .select('*', { count: 'exact', head: true });
      
    if (documentLinksError) throw documentLinksError;
    
    // 3. Count Google Drive links
    const { count: driveLinksCount, error: driveLinksError } = await supabase
      .from('google_drive_links')
      .select('*', { count: 'exact', head: true });
      
    if (driveLinksError) throw driveLinksError;
    
    // Calculate total
    const totalCount = (websiteUrlsCount || 0) + (documentLinksCount || 0) + (driveLinksCount || 0);
    
    // Get recent resources (added in the last 48 hours)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    const timeAgoStr = timeAgo.toISOString();
    
    // Recent website URLs
    const { count: recentWebsiteUrlsCount, error: recentWebsiteUrlsError } = await supabase
      .from('website_urls')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', timeAgoStr);
      
    if (recentWebsiteUrlsError) throw recentWebsiteUrlsError;
    
    // Recent document links
    const { count: recentDocumentLinksCount, error: recentDocumentLinksError } = await supabase
      .from('document_links')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', timeAgoStr);
      
    if (recentDocumentLinksError) throw recentDocumentLinksError;
    
    // Recent Google Drive links
    const { count: recentDriveLinksCount, error: recentDriveLinksError } = await supabase
      .from('google_drive_links')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', timeAgoStr);
      
    if (recentDriveLinksError) throw recentDriveLinksError;
    
    // Calculate recent total
    const recentCount = (recentWebsiteUrlsCount || 0) + (recentDocumentLinksCount || 0) + (recentDriveLinksCount || 0);
    
    // Calculate change percentage
    const previousPeriodCount = totalCount - recentCount;
    let changePercentage = 0;
    
    if (previousPeriodCount > 0) {
      changePercentage = Math.round((recentCount / previousPeriodCount) * 100) / 5;
    }
    
    return {
      total: totalCount,
      recent: recentCount,
      changePercentage
    };
  } catch (error) {
    console.error("Error getting training resources count:", error);
    return { total: 0, recent: 0, changePercentage: 0 };
  }
};
