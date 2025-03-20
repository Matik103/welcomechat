
import { supabase } from "@/integrations/supabase/client";

export const setupRealtimeActivities = async () => {
  try {
    console.log("Setting up realtime activities...");
    
    // Set up subscription to client_activities table changes
    const subscription = supabase
      .channel('client_activities_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'client_activities' 
      }, payload => {
        console.log('Activity change received!', payload);
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
    
    console.log("Realtime subscription set up successfully");
    
    return { 
      success: true,
      subscription
    };
  } catch (error) {
    console.error("Error setting up realtime:", error);
    return { success: false, error };
  }
};
