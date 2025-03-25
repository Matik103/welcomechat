
import { createClient } from "@/integrations/supabase/client";
import { getDateRange } from "@/utils/dateUtils";

/**
 * Gets the average response time for chat interactions
 * @param timeRange The time range to check
 * @param clientId Optional client ID to filter by
 * @returns Promise that resolves to the average response time in seconds
 */
export const getAverageResponseTime = async (
  timeRange: "1d" | "1m" | "1y" | "all",
  clientId?: string
): Promise<number> => {
  try {
    const supabase = createClient();
    const { startDate } = getDateRange(timeRange);
    
    // Create query for chat interactions with response time
    let query = supabase
      .from("ai_agents")
      .select("response_time_ms")
      .eq("interaction_type", "chat_interaction")
      .not("response_time_ms", "is", null)
      .gte("created_at", startDate.toISOString());
      
    // Add client filter if specified
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching response times:", error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Calculate average response time in seconds
    const totalResponseTimeMs = data.reduce(
      (sum, interaction) => sum + (interaction.response_time_ms || 0),
      0
    );
    
    const avgResponseTimeSeconds = (totalResponseTimeMs / data.length) / 1000;
    
    return parseFloat(avgResponseTimeSeconds.toFixed(2));
  } catch (error) {
    console.error("Error in getAverageResponseTime:", error);
    return 0;
  }
};
