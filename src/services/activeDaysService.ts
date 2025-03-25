
import { createClient } from "@/integrations/supabase/client";
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
    const supabase = createClient();
    const { startDate } = getDateRange(timeRange);
    
    // Create a query that counts distinct dates
    let query = supabase
      .from("client_activities")
      .select("created_at")
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
      data?.map((row) => new Date(row.created_at).toDateString()) || []
    );
    
    return uniqueDays.size;
  } catch (error) {
    console.error("Error in getActiveDays:", error);
    return 0;
  }
};
