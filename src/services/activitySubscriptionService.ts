
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets up a real-time subscription for any client activities
 */
export const subscribeToActivities = (clientId: string, onUpdate: () => void) => {
  // Subscribe to client_activities table
  const activitiesChannel = supabase
    .channel('client-activities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'client_activities',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log('Client activity changed:', payload);
        onUpdate();
      }
    )
    .subscribe();
  
  // Also try to subscribe to the agent table if possible
  setupAgentTableSubscription(clientId, onUpdate);
    
  return activitiesChannel;
};

/**
 * Sets up realtime subscription to the agent's table if it exists
 */
const setupAgentTableSubscription = async (clientId: string, onUpdate: () => void) => {
  try {
    // Get the agent_name for this client
    const { data, error } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();
    
    if (error || !data) {
      console.error("Error fetching client agent name:", error);
      return null;
    }
    
    const sanitizedAgentName = data.agent_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Set up subscription to agent table
    const agentChannel = supabase
      .channel(`${sanitizedAgentName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: sanitizedAgentName
        },
        (payload) => {
          console.log(`Agent table ${sanitizedAgentName} changed:`, payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log(`Subscription to ${sanitizedAgentName} status:`, status);
      });
    
    return agentChannel;
  } catch (err) {
    console.error("Error setting up agent table subscription:", err);
    return null;
  }
};
