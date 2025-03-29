
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to all activities in the system and triggers the callback function
 * when any activity changes
 * 
 * @param callback Function to call when activities change
 * @returns The realtime channel object
 */
export const subscribeToAllActivities = (callback: () => void) => {
  // Subscribe to all activity-related tables
  const activitiesChannel = supabase.channel('public:activities')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'activities',
    }, () => {
      callback();
    })
    .subscribe();

  return activitiesChannel;
};
