
import { supabase } from "@/integrations/supabase/client";
import { ErrorLog } from "@/types/client-dashboard";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Fetches error logs for a specific client directly from the ai_agents table
 */
export const fetchErrorLogs = async (clientId: string): Promise<ErrorLog[]> => {
  try {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, error_type, error_message, error_status, created_at, query_text")
      .eq("client_id", clientId)
      .eq("is_error", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    
    // Transform the data to match the ErrorLog interface
    return (data || []).map(item => ({
      id: item.id.toString(),
      error_type: item.error_type || "unknown",
      message: item.error_message || "Unknown error",
      status: item.error_status || "pending",
      created_at: item.created_at,
      client_id: clientId,
      query_text: item.query_text
    })) as ErrorLog[];
  } catch (err) {
    console.error("Error fetching error logs:", err);
    throw err;
  }
};

/**
 * Sets up a realtime subscription for error logs
 */
export const subscribeToErrorLogs = (
  clientId: string,
  onUpdate: () => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`error-logs-${clientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_agents",
        filter: `client_id=eq.${clientId} AND is_error=eq.true`
      },
      (payload) => {
        console.log("New error log detected:", payload);
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};
