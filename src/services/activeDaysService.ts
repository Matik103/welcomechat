
import { supabase } from "@/integrations/supabase/client";
import { getDateRange } from "@/utils/dateUtils";

/**
 * Gets the number of active days for a client or all clients
 * @param timeRange The time range to check
 * @param clientId Optional client ID to filter by
 * @returns Promise that resolves to the number of active days
 */
export const getActiveDays = async (
  timeRange: "1d" | "1m" | "1y" | "all",
  clientId?: string
): Promise<number> => {
  try {
    const { startDate } = getDateRange(timeRange);
    
    // Use ai_agents table instead of client_activities
    let query = supabase
      .from("ai_agents")
      .select("created_at")
      .eq("interaction_type", "chat_interaction")
      .gte("created_at", startDate.toISOString());
      
    // Add client filter if specified
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching active days:", error);
      return 0;
    }
    
    // Convert timestamps to dates and count unique days
    const uniqueDays = new Set(
      data?.map((row) => {
        // Handle null created_at safely
        const created_at = row.created_at || '';
        if (!created_at) return '';
        return new Date(created_at).toDateString();
      }).filter(date => date !== '') || []
    );
    
    return uniqueDays.size;
  } catch (error) {
    console.error("Error in getActiveDays:", error);
    return 0;
  }
};
