
import { ActivityType } from '@/types/activity';
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a client activity in the activities table (not client_activities)
 */
export const createActivity = async (
  client_id: string,
  type: ActivityType | string,
  description: string,
  metadata: any = {}
) => {
  try {
    // Insert into the activities table instead of client_activities
    const { data, error } = await supabase
      .from("activities")
      .insert({
        ai_agent_id: client_id, // activities table uses ai_agent_id instead of client_id
        type,
        description,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error creating activity:", error);
      // Fallback to console log if database insert fails
      console.log(`[Activity Log] ${type}:`, {
        client_id,
        description,
        type,
        metadata,
        created_at: new Date().toISOString()
      });
      return { success: false, data: null, error };
    }
    
    return { success: true, data, error: null };
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
