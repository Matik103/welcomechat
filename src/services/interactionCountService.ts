
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the total count of chat interactions for a client
 */
export const fetchTotalInteractions = async (clientId: string): Promise<number> => {
  if (!clientId) return 0;
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    const { count, error } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("interaction_type", "chat_interaction");
    
    if (error) {
      console.error("Error counting interactions:", error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error("Error fetching total interactions:", err);
    return 0;
  }
};
