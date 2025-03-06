
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the average response time for a client's AI agent
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
      // Try to get response times from the agent's table metadata using Edge Function
      const { data, error } = await supabase
        .functions
        .invoke("dynamically-query-table", {
          body: {
            tableName: sanitizedAgentName,
            query: "SELECT metadata FROM \"${tableName}\" WHERE metadata IS NOT NULL ORDER BY id DESC LIMIT 30"
          }
        });
      
      if (error || !data || !Array.isArray(data)) {
        console.log(`Error querying ${sanitizedAgentName} table:`, error);
        return 0;
      }
      
      // Extract and calculate average response time
      let totalResponseTime = 0;
      let validResponseTimes = 0;
      
      data.forEach(item => {
        if (
          item && 
          item.metadata && 
          (
            (item.metadata.response_time && typeof item.metadata.response_time === 'number') ||
            (item.metadata.processing_time && typeof item.metadata.processing_time === 'number')
          )
        ) {
          // Use response_time if available, otherwise use processing_time
          const responseTime = item.metadata.response_time || item.metadata.processing_time;
          
          // Only consider reasonable response times (less than 30 seconds)
          if (responseTime > 0 && responseTime < 30000) {
            totalResponseTime += responseTime;
            validResponseTimes++;
          }
        }
      });
      
      if (validResponseTimes === 0) {
        return 0;
      }
      
      // Return average in seconds, rounded to one decimal place
      return Math.round((totalResponseTime / validResponseTimes / 1000) * 10) / 10;
    } catch (err) {
      console.error("Error processing agent data for response times:", err);
      return 0;
    }
  } catch (err) {
    console.error("Error fetching average response time:", err);
    return 0;
  }
};
