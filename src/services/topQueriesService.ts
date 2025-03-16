
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";
import { QueryItem } from "@/types/client-dashboard";

/**
 * Fetches the top queries for a client
 */
export const fetchTopQueries = async (clientId: string): Promise<QueryItem[]> => {
  if (!clientId) return [];
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    const { data, error } = await supabase
      .from("common_queries")
      .select("query_text, frequency")
      .eq("client_id", clientId)
      .order("frequency", { ascending: false })
      .limit(5);
    
    if (error || !data) {
      console.error("Error fetching top queries:", error);
      return [];
    }
    
    // Return the data directly as it already has the correct structure
    return data.map(item => ({
      id: `query-${item.query_text.substring(0, 10)}`,
      query_text: item.query_text,
      frequency: item.frequency || 1
    }));
  } catch (err) {
    console.error("Error fetching top queries:", err);
    return [];
  }
};
