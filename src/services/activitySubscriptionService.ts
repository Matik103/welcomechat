
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
        event: "*",
        schema: "public",
        table: "client_activities",
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log(`Activity update for client ${clientId}:`, payload);
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribes to all client activities (for admin dashboard)
 */
export const subscribeToAllActivities = (onUpdate: () => void): RealtimeChannel => {
  const channel = supabase
    .channel(`all-client-activities`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "client_activities"
      },
      (payload) => {
        console.log("Activity update (global):", payload);
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
      (payload) => {
        console.log(`New chat interaction for client ${clientId}:`, payload);
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
      (payload) => {
        console.log("New chat interaction (global):", payload);
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};
