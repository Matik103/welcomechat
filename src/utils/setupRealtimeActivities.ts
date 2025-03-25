
import { supabase } from "@/integrations/supabase/client";

export const setupRealtimeActivities = async () => {
  try {
    // Enable Realtime subscription for the client_activities table
    await supabase.channel('public:client_activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_activities',
      }, (payload) => {
        console.log('Client activity changed:', payload);
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for client_activities: ${status}`);
      });

    // Enable Realtime subscription for the ai_agents table (chat interactions)
    await supabase.channel('public:ai_agents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agents',
        filter: `interaction_type=eq.chat_interaction`
      }, (payload) => {
        console.log('Chat interaction occurred:', payload);
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ai_agents: ${status}`);
      });

    return true;
  } catch (error) {
    console.error('Error setting up realtime activities:', error);
    return false;
  }
};
