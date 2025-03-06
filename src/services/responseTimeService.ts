
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
      // Try to get response times from the agent's table metadata using rpc
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `SELECT metadata FROM "${sanitizedAgentName}" WHERE metadata IS NOT NULL ORDER BY id DESC LIMIT 30`
      });
      
      if (error || !data || !Array.isArray(data)) {
        // Fallback to client_activities if agent table doesn't exist
        console.log(`Error querying ${sanitizedAgentName} table:`, error);
        
        const { data: activityData, error: activityError } = await supabase
          .from("client_activities")
          .select("metadata")
          .eq("client_id", clientId)
          .eq("activity_type", "chat_interaction")
          .order("created_at", { ascending: false })
          .limit(30);
        
        if (activityError || !activityData) {
          console.error("Error fetching recent interactions:", activityError);
          return 0;
        }
        
        let totalResponseTime = 0;
        let countWithResponseTime = 0;
        
        activityData.forEach(interaction => {
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
      }
      
      // Calculate average response time from agent table metadata
      let totalResponseTime = 0;
      let countWithResponseTime = 0;
      
      data.forEach(item => {
        if (item && item.metadata && 
            typeof item.metadata === 'object' && 
            'response_time_ms' in item.metadata) {
          totalResponseTime += Number(item.metadata.response_time_ms);
          countWithResponseTime++;
        }
      });
      
      return countWithResponseTime > 0 
        ? Number((totalResponseTime / countWithResponseTime / 1000).toFixed(2))
        : 0;
    } catch (err) {
      // Fallback to client_activities
      console.error(`Error processing data from ${sanitizedAgentName} table:`, err);
      
      const { data: activityData, error: activityError } = await supabase
        .from("client_activities")
        .select("metadata")
        .eq("client_id", clientId)
        .eq("activity_type", "chat_interaction")
        .order("created_at", { ascending: false })
        .limit(30);
      
      if (activityError || !activityData) {
        console.error("Error fetching recent interactions:", activityError);
        return 0;
      }
      
      let totalResponseTime = 0;
      let countWithResponseTime = 0;
      
      activityData.forEach(interaction => {
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
    }
  } catch (err) {
    console.error("Error fetching average response time:", err);
    return 0;
  }
};
