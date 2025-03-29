
import { supabase } from '@/integrations/supabase/client';

/**
 * Sets up realtime subscriptions for activities
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export const setupRealtimeActivities = async (): Promise<boolean> => {
  try {
    // Enable realtime for activities table
    await supabase.channel('public:activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities',
      }, (payload) => {
        console.log('Activity changed:', payload);
      })
      .subscribe();
    
    return true;
  } catch (error) {
    console.error('Error setting up realtime activities:', error);
    return false;
  }
};
