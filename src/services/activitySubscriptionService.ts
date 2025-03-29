
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Simplified subscriptions that return dummy channels
 */
export const subscribeToClientActivities = (clientId: string, onUpdate: () => void): RealtimeChannel => {
  const channel = supabase.channel(`dummy-channel-${Date.now()}`);
  channel.subscribe();
  return channel;
};

export const subscribeToAllActivities = (onUpdate: () => void): RealtimeChannel => {
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
      () => {
        onUpdate();
      }
    )
    .subscribe();

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
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};
