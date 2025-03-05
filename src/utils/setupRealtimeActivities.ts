
import { supabase } from "@/integrations/supabase/client";

export const setupRealtimeActivities = async () => {
  try {
    console.log("Setting up realtime activities...");
    
    // Enable row-level security for client_activities table
    // Note: Using raw SQL queries instead of RPC functions due to type constraints
    const { error: error1 } = await supabase
      .from('_rpc')
      .select('*')
      .rpc('execute_sql', { 
        sql: 'ALTER TABLE client_activities REPLICA IDENTITY FULL;' 
      });
    
    if (error1) {
      console.error("Error enabling replica identity:", error1);
    }
    
    // Add client_activities table to the supabase_realtime publication
    const { error: error2 } = await supabase
      .from('_rpc')
      .select('*')
      .rpc('execute_sql', { 
        sql: 'ALTER PUBLICATION supabase_realtime ADD TABLE client_activities;' 
      });
    
    if (error2) {
      console.error("Error adding table to publication:", error2);
    }
    
    return { success: !error1 && !error2 };
  } catch (error) {
    console.error("Error setting up realtime:", error);
    return { success: false, error };
  }
};
