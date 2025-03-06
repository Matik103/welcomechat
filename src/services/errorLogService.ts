
import { supabase } from "@/integrations/supabase/client";
import { ErrorLog } from "@/types/client-dashboard";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches error logs for a specific client
 */
export const fetchErrorLogs = async (clientId: string): Promise<ErrorLog[]> => {
  if (!clientId) return [];
  
  // Try to ensure auth is valid before making the request
  const isAuthValid = await checkAndRefreshAuth();
  if (!isAuthValid) {
    return [];
  }
  
  const { data, error } = await supabase
    .from("error_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching error logs:", error);
    throw error;
  }
  
  return data as ErrorLog[];
};

/**
 * Sets up a real-time subscription for error logs
 */
export const subscribeToErrorLogs = (clientId: string, onUpdate: () => void) => {
  const channel = supabase
    .channel('error-logs-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'error_logs',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log('Error logs changed:', payload);
        onUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
