
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
  
  // First try to get from error_logs table
  const { data: errorLogs, error: errorLogsError } = await supabase
    .from("error_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!errorLogsError && errorLogs?.length > 0) {
    return errorLogs as ErrorLog[];
  }
  
  // If no error logs found or error occurred, try to find errors in agent table metadata
  try {
    // Get the agent_name for this client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error("Error fetching client agent name:", clientError);
      return [];
    }
    
    const sanitizedAgentName = clientData.agent_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Try to get error entries from agent table metadata using rpc
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: `SELECT id, metadata FROM "${sanitizedAgentName}" WHERE metadata IS NOT NULL ORDER BY id DESC LIMIT 50`
    });
    
    if (error || !data || !Array.isArray(data)) {
      console.log(`Error querying ${sanitizedAgentName} table:`, error);
      return [];
    }
    
    // Filter entries with error information and format them
    const agentErrors: ErrorLog[] = [];
    
    data.forEach(item => {
      if (item && item.metadata && 
          (item.metadata.error || item.metadata.error_type || item.metadata.error_message)) {
        
        agentErrors.push({
          id: `agent-${item.id}`,
          error_type: item.metadata.error_type || 'Processing Error',
          message: item.metadata.error_message || item.metadata.error || 'Unknown error occurred',
          created_at: item.metadata.timestamp || new Date().toISOString(),
          status: 'pending',
          client_id: clientId
        });
      }
    });
    
    return agentErrors.slice(0, 10);
  } catch (err) {
    console.error("Error processing agent data for errors:", err);
    return [];
  }
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
