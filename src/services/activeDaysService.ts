
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the number of active days for a client's AI agent
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
      // We need to use Edge Function for dynamic table access
      const { data, error } = await supabase
        .functions
        .invoke("dynamically-query-table", {
          body: {
            tableName: sanitizedAgentName,
            query: "SELECT metadata FROM \"${tableName}\" WHERE metadata IS NOT NULL"
          }
        });
      
      if (error || !data || !Array.isArray(data)) {
        // Fallback to client_activities
        console.log(`Error querying ${sanitizedAgentName} table:`, error);
        
        const { data: activeDays, error: activeDaysError } = await supabase
          .from("client_activities")
          .select("created_at")
          .eq("client_id", clientId)
          .eq("activity_type", "chat_interaction");
        
        if (activeDaysError) {
          console.error("Error fetching active days from activities:", activeDaysError);
          return 0;
        }
        
        // Count unique days from client_activities
        const uniqueDays = new Set();
        activeDays?.forEach(activity => {
          if (activity.created_at) {
            const date = new Date(activity.created_at).toISOString().split('T')[0];
            uniqueDays.add(date);
          }
        });
        
        return uniqueDays.size;
      }
      
      // Extract timestamps from metadata and count unique days
      const uniqueDays = new Set();
      
      data.forEach(item => {
        if (item && item.metadata && item.metadata.timestamp) {
          const date = new Date(item.metadata.timestamp).toISOString().split('T')[0];
          uniqueDays.add(date);
        }
      });
      
      return uniqueDays.size;
    } catch (err) {
      console.error("Error processing agent data for active days:", err);
      return 0;
    }
  } catch (err) {
    console.error("Error fetching active days:", err);
    return 0;
  }
};
