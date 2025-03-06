
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets up a real-time subscription for client activities
 */
export const subscribeToActivities = (clientId: string, onUpdate: () => void) => {
  const channel = supabase
    .channel('activities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'client_activities',
        filter: `client_id=eq.${clientId}`
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
