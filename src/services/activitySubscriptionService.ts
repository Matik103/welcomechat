
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets up a real-time subscription for client activities
 * @param clientId - The client ID to subscribe to
 * @param onUpdate - Callback function that will be called when updates occur
 * @returns The subscription channel for cleanup
 */
export const subscribeToActivities = (clientId: string, onUpdate: () => void) => {
  if (!clientId) {
    console.error("No client ID provided for activity subscription");
    return null;
  }

  console.log("Setting up subscription for client activities:", clientId);
  
  const channel = supabase
    .channel(`activities-${clientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'client_activities',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log("Activity change detected:", payload);
        onUpdate();
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
    
  return channel;
};

/**
 * Removes an activity subscription channel
 * @param channel - The channel to unsubscribe from
 */
export const unsubscribeFromActivities = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};

/**
 * Sets up a global subscription for all client activities across the system
 * @param onUpdate - Callback function that will be called when any activity is added
 * @returns The subscription channel for cleanup
 */
export const subscribeToAllActivities = (onUpdate: () => void) => {
  console.log("Setting up global subscription for all client activities");
  
  const channel = supabase
    .channel('all-activities')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'client_activities'
      },
      (payload) => {
        console.log("New activity detected in global listener:", payload);
        onUpdate();
      }
    )
    .subscribe((status) => {
      console.log("Global activity subscription status:", status);
    });
    
  return channel;
};
