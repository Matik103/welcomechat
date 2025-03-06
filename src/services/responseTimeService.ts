
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the average response time for a client's recent interactions
 */
export const fetchAverageResponseTime = async (clientId: string): Promise<number> => {
  if (!clientId) return 0;
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    const { data, error } = await supabase
      .from("client_activities")
      .select("metadata")
      .eq("client_id", clientId)
      .eq("activity_type", "chat_interaction")
      .order("created_at", { ascending: false })
      .limit(30);
    
    if (error || !data) {
      console.error("Error fetching recent interactions:", error);
      return 0;
    }
    
    let totalResponseTime = 0;
    let countWithResponseTime = 0;
    
    data.forEach(interaction => {
      if (interaction.metadata && 
          typeof interaction.metadata === 'object' && 
          'response_time_ms' in interaction.metadata) {
        totalResponseTime += Number(interaction.metadata.response_time_ms);
        countWithResponseTime++;
      }
    });
    
    return countWithResponseTime > 0 
      ? Number((totalResponseTime / countWithResponseTime / 1000).toFixed(2))
      : 0;
  } catch (err) {
    console.error("Error fetching average response time:", err);
    return 0;
  }
};
