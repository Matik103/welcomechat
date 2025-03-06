
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
    
    // First, get the agent_name for this client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error("Error fetching client agent name:", clientError);
      return 0;
    }
    
    const sanitizedAgentName = clientData.agent_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Get the count from the agent's table if it exists
    try {
      // Use a dynamic query to get count from the agent's table
      const { count, error } = await supabase
        .from(sanitizedAgentName)
        .select("*", { count: "exact", head: true });
      
      if (error) {
        // Fallback to client_activities if agent table doesn't exist or other error
        console.log(`Error counting from ${sanitizedAgentName} table:`, error);
        
        const { count: activityCount, error: activityError } = await supabase
          .from("client_activities")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("activity_type", "chat_interaction");
        
        if (activityError) {
          console.error("Error counting interactions from activities:", activityError);
          return 0;
        }
        
        return activityCount || 0;
      }
      
      return count || 0;
    } catch (err) {
      console.error("Error in dynamic query:", err);
      
      // Fallback to client_activities
      const { count: activityCount, error: activityError } = await supabase
        .from("client_activities")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (activityError) {
        console.error("Error counting interactions from activities:", activityError);
        return 0;
      }
      
      return activityCount || 0;
    }
  } catch (err) {
    console.error("Error fetching total interactions:", err);
    return 0;
  }
};
