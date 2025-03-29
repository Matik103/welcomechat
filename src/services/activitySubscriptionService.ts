
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribes to client activities for a specific client
 */
export const subscribeToClientActivities = (clientId: string, onUpdate: () => void): RealtimeChannel => {
  const channel = supabase
    .channel(`client-activities-${clientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activities",
        filter: `ai_agent_id=eq.${clientId}`
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribes to all activities
 */
export const subscribeToAllActivities = (onUpdate: () => void): RealtimeChannel => {
  const channel = supabase
    .channel(`all-activities`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "activities"
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

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
