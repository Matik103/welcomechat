
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Store channel reference to avoid duplicate subscriptions
let activeChannel: RealtimeChannel | null = null;

export const setupRealtimeActivities = async () => {
  try {
    console.log("Setting up realtime activities...");
    
    // If there's already an active subscription, don't create another one
    if (activeChannel) {
      console.log("Realtime subscription already exists, reusing existing channel");
      return { 
        success: true,
        subscription: activeChannel
      };
    }
    
    // Set up subscription to client_activities table changes
    activeChannel = supabase
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
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Reset the channel reference if connection is closed or has error
          activeChannel = null;
        }
      });
    
    console.log("Realtime subscription set up successfully");
    
    return { 
      success: true,
      subscription: activeChannel
    };
  } catch (error) {
    console.error("Error setting up realtime:", error);
    activeChannel = null;
    return { success: false, error };
  }
};

// Add a cleanup method to properly remove the channel when needed
export const cleanupRealtimeActivities = () => {
  if (activeChannel) {
    console.log("Cleaning up realtime activities subscription");
    supabase.removeChannel(activeChannel);
    activeChannel = null;
    return true;
  }
  return false;
};
