
import { supabase } from "@/integrations/supabase/client";

export interface InteractionStats {
  totalInteractions: number;
  successRate: number;
  averageResponseTime: number;
  activeDays: number;
}

export const useInteractionStats = async (clientId: string): Promise<InteractionStats> => {
  try {
    // Get total interactions count
    const { count: totalInteractions, error: countError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction");

    if (countError) {
      console.error("Error fetching interaction count:", countError);
      return {
        totalInteractions: 0,
        successRate: 0,
        averageResponseTime: 0,
        activeDays: 0,
      };
    }

    // Get average response time
    const { data: responseTimeData, error: responseTimeError } = await supabase
      .from("ai_agents")
      .select("response_time_ms")
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction")
      .not("response_time_ms", "is", null);

    let averageResponseTime = 0;
    if (!responseTimeError && responseTimeData && responseTimeData.length > 0) {
      const sum = responseTimeData.reduce((acc, item) => acc + (item.response_time_ms || 0), 0);
      averageResponseTime = Math.round(sum / responseTimeData.length);
    }

    // Get unique active days
    const { data: activeDaysData, error: activeDaysError } = await supabase
      .from("ai_agents")
      .select("created_at")
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction");

    let activeDays = 0;
    if (!activeDaysError && activeDaysData) {
      const uniqueDays = new Set();
      activeDaysData.forEach((item) => {
        if (item.created_at) {
          const date = new Date(item.created_at || '').toDateString();
          uniqueDays.add(date);
        }
      });
      activeDays = uniqueDays.size;
    }

    // Get success rate
    const { count: errorCount, error: errorCountError } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_error", true);

    let successRate = 100;
    if (!errorCountError && totalInteractions && totalInteractions > 0) {
      successRate = Math.round(
        ((totalInteractions - (errorCount || 0)) / totalInteractions) * 100
      );
    }

    return {
      totalInteractions: totalInteractions || 0,
      successRate,
      averageResponseTime,
      activeDays,
    };
  } catch (error) {
    console.error("Error in useInteractionStats:", error);
    return {
      totalInteractions: 0,
      successRate: 0,
      averageResponseTime: 0,
      activeDays: 0,
    };
  }
};
