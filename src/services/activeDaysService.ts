
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the number of active days for a client
 */
export const fetchActiveDays = async (clientId: string): Promise<number> => {
  if (!clientId) return 0;
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    const { data, error } = await supabase
      .from("client_activities")
      .select("created_at")
      .eq("client_id", clientId)
      .eq("activity_type", "chat_interaction");
    
    if (error || !data) {
      console.error("Error fetching active days:", error);
      return 0;
    }
    
    const uniqueDates = new Set();
    data.forEach(activity => {
      const activityDate = new Date(activity.created_at).toDateString();
      uniqueDates.add(activityDate);
    });
    
    return uniqueDates.size;
  } catch (err) {
    console.error("Error fetching active days:", err);
    return 0;
  }
};
