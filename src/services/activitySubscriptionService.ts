
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// This file contains placeholder functions since client_activities table has been removed

/**
 * Subscribes to client activities for a specific client - Currently a no-op function
 */
export const subscribeToClientActivities = (clientId: string, onUpdate: () => void): RealtimeChannel => {
  console.log('Activity logging is disabled - client_activities table has been removed');
  
  // Create a dummy channel that doesn't actually subscribe to anything
  const channel = supabase.channel(`dummy-channel-${Date.now()}`);
  channel.subscribe();
  
  return channel;
};

/**
 * Subscribes to all client activities (for admin dashboard) - Currently a no-op function
 */
export const subscribeToAllActivities = (onUpdate: () => void): RealtimeChannel => {
  console.log('Activity logging is disabled - client_activities table has been removed');
  
  // Create a dummy channel that doesn't actually subscribe to anything
  const channel = supabase.channel(`dummy-channel-${Date.now()}`);
  channel.subscribe();
  
  return channel;
};

/**
 * Subscribes to chat interactions for a specific client
 */
export const subscribeToChatInteractions = (clientId: string, onUpdate: () => void): RealtimeChannel => {
  const channel = supabase
    .channel(`chat-interactions-${clientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_agents",
        filter: `client_id=eq.${clientId} AND interaction_type=eq.chat_interaction`
      },
      (payload) => {
        console.log(`New chat interaction for client ${clientId}:`, payload);
        onUpdate();
      }
    )
    .subscribe((status) => {
      console.log(`Realtime subscription status for client ${clientId} chat interactions: ${status}`);
    });

  return channel;
};

/**
 * Subscribes to all chat interactions (for admin dashboard)
 */
export const subscribeToAllChatInteractions = (onUpdate: () => void): RealtimeChannel => {
  const channel = supabase
    .channel(`all-chat-interactions`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_agents",
        filter: `interaction_type=eq.chat_interaction`
      },
      (payload) => {
        console.log("New chat interaction (global):", payload);
        onUpdate();
      }
    )
    .subscribe((status) => {
      console.log(`Realtime subscription status for all chat interactions: ${status}`);
    });

  return channel;
};
