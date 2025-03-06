
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
    
    try {
      // Try to get data from the agent's table if it exists
      // We need to use executeQuery for dynamic table access
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `SELECT metadata FROM "${sanitizedAgentName}" WHERE metadata IS NOT NULL`
      });
      
      if (error || !data || !Array.isArray(data)) {
        // Fallback to client_activities if agent table doesn't exist
        console.log(`Error querying ${sanitizedAgentName} table:`, error);
        
        const { data: activityData, error: activityError } = await supabase
          .from("client_activities")
          .select("created_at")
          .eq("client_id", clientId)
          .eq("activity_type", "chat_interaction");
        
        if (activityError || !activityData) {
          console.error("Error fetching active days:", activityError);
          return 0;
        }
        
        const uniqueDates = new Set();
        activityData.forEach(activity => {
          const activityDate = new Date(activity.created_at).toDateString();
          uniqueDates.add(activityDate);
        });
        
        return uniqueDates.size;
      }
      
      // Extract dates from metadata in the agent table
      const uniqueDates = new Set();
      
      data.forEach(item => {
        if (item && item.metadata && item.metadata.timestamp) {
          const dateStr = new Date(item.metadata.timestamp).toDateString();
          uniqueDates.add(dateStr);
        }
      });
      
      return uniqueDates.size;
    } catch (err) {
      // Fallback to client_activities
      console.error(`Error processing data from ${sanitizedAgentName} table:`, err);
      
      const { data: activityData, error: activityError } = await supabase
        .from("client_activities")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction");
      
      if (activityError || !activityData) {
        console.error("Error fetching active days:", activityError);
        return 0;
      }
      
      const uniqueDates = new Set();
      activityData.forEach(activity => {
        const activityDate = new Date(activity.created_at).toDateString();
        uniqueDates.add(activityDate);
      });
      
      return uniqueDates.size;
    }
  } catch (err) {
    console.error("Error fetching active days:", err);
    return 0;
  }
};
