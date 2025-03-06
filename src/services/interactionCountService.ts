
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
      // Use RPC to dynamically query the agent's table
      const { data, error } = await supabase.rpc('execute_sql', {
        query_text: `SELECT COUNT(*) FROM "${sanitizedAgentName}"`
      });
      
      if (error || !data || !Array.isArray(data) || data.length === 0) {
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
      
      // Assuming the first row has the count in a field named "count"
      return parseInt(data[0]?.count || '0', 10);
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
