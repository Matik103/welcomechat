import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Keep track of active subscription channels to prevent duplication
const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Sets up a real-time subscription for client activities
 * @param clientId - The client ID to subscribe to
 * @param onUpdate - Callback function that will be called when updates occur
 * @returns The subscription channel for cleanup
 */
export const subscribeToActivities = (
  clientId: string, 
  onUpdate: () => void
): RealtimeChannel | null => {
  if (!clientId) {
    console.error("No client ID provided for activity subscription");
    return null;
  }

  // Check if we already have an active subscription for this client
  const channelKey = `activities-${clientId}`;
  if (activeChannels.has(channelKey)) {
    console.log("Reusing existing activity subscription for client:", clientId);
    return activeChannels.get(channelKey) || null;
  }

  console.log("Setting up subscription for client activities:", clientId);
  
  const channel = supabase
    .channel(channelKey)
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
      console.log(`Subscription status for ${channelKey}:`, status);
      
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // Remove from active channels if connection is closed or has error
        activeChannels.delete(channelKey);
      }
    });
    
  // Store the channel reference
  activeChannels.set(channelKey, channel);
  
  return channel;
};

/**
 * Sets up a global subscription for all client activities across the system
 * @param onUpdate - Callback function that will be called when any activity is added
 * @returns The subscription channel for cleanup
 */
export const subscribeToAllActivities = (onUpdate: () => void): RealtimeChannel => {
  // Check if we already have an active global subscription
  const channelKey = 'all-activities';
  if (activeChannels.has(channelKey)) {
    console.log("Reusing existing global activity subscription");
    return activeChannels.get(channelKey)!;
  }

  console.log("Setting up global subscription for all client activities");
  
  const channel = supabase
    .channel(channelKey)
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
      console.log(`Global activity subscription status:`, status);
      
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // Remove from active channels if connection is closed or has error
        activeChannels.delete(channelKey);
      }
    });
    
  // Store the channel reference
  activeChannels.set(channelKey, channel);
    
  return channel;
};

/**
 * Cleanup all active subscriptions
 */
export const cleanupAllSubscriptions = () => {
  activeChannels.forEach((channel, key) => {
    console.log(`Cleaning up subscription: ${key}`);
    supabase.removeChannel(channel);
  });
  
  activeChannels.clear();
};
