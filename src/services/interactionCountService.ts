
import { createClient } from "@/integrations/supabase/client";
import { getDateRange } from "@/utils/dateUtils";

/**
 * Gets the total number of interactions for a client or all clients
 * @param timeRange The time range to check
 * @param clientId Optional client ID to filter by
 * @returns Promise that resolves to the number of interactions
 */
export const getInteractionCount = async (
  timeRange: "1d" | "1m" | "1y" | "all",
  clientId?: string
): Promise<number> => {
  try {
    const supabase = createClient();
    const { startDate } = getDateRange(timeRange);
    
    // Create query for chat interactions
    let query = supabase
      .from("client_activities")
      .select("id", { count: "exact" })
      .eq("activity_type", "chat_interaction")
      .gte("created_at", startDate.toISOString());
      
    // Add client filter if specified
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { count, error } = await query;
    
    if (error) {
      console.error("Error fetching interaction count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getInteractionCount:", error);
    return 0;
  }
};
