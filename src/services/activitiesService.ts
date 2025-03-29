
import { ActivityType } from '@/types/activity';
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a client activity log (console only, no database operations)
 * This prevents the 'invalid input value for enum activity_type' error
 */
export const createActivity = async (
  client_id: string,
  type: ActivityType | string,
  description: string,
  metadata: any = {}
) => {
  try {
    // Log to console but don't insert to database
    console.log(`[Activity Service] ${type}:`, {
      client_id,
      description,
      type,
      metadata,
      created_at: new Date().toISOString()
    });
    
    return { success: true, data: null, error: null };
  } catch (error) {
    console.error("Error logging activity:", error);
    return { success: false, data: null, error };
  }
};

/**
 * Get recent activities from database
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return { success: false, data: [], error };
  }
};
