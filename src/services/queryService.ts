
import { supabase } from "@/integrations/supabase/client";
import { QueryItem } from "@/types/client-dashboard";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches common queries for a specific client
 */
export const fetchQueries = async (clientId: string): Promise<QueryItem[]> => {
  if (!clientId) return [];
  
  // Try to ensure auth is valid before making the request
  const isAuthValid = await checkAndRefreshAuth();
  if (!isAuthValid) {
    return [];
  }
  
  const { data, error } = await supabase
    .from("common_queries")
    .select("*")
    .eq("client_id", clientId)
    .order("frequency", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching queries:", error);
    throw error;
  }
  
  return (data || []).map((item: any) => ({
    id: item.id,
    query_text: item.query_text,
    frequency: item.frequency,
    last_asked: item.updated_at
  })) as QueryItem[];
};

/**
 * Sets up a real-time subscription for common queries
 */
export const subscribeToQueries = (clientId: string, onUpdate: () => void) => {
  const channel = supabase
    .channel('queries-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'common_queries',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log('Common queries changed:', payload);
        onUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
