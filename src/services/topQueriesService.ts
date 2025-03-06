
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the top queries for a client
 */
export const fetchTopQueries = async (clientId: string): Promise<string[]> => {
  if (!clientId) return [];
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    const { data, error } = await supabase
      .from("common_queries")
      .select("query_text")
      .eq("client_id", clientId)
      .order("frequency", { ascending: false })
      .limit(5);
    
    if (error || !data) {
      console.error("Error fetching top queries:", error);
      return [];
    }
    
    return data.map(q => q.query_text);
  } catch (err) {
    console.error("Error fetching top queries:", err);
    return [];
  }
};
