import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Reactivates a client account that was scheduled for deletion
 * Should be called when a client signs in
 */
export const reactivateClientAccount = async (email: string): Promise<boolean> => {
  try {
    console.log("Checking if account needs reactivation:", email);
    
    // Find the client with this email that has a deletion_scheduled_at date
    const { data: clients, error: findError } = await supabase
      .from('ai_agents')
      .select('id, client_name, deletion_scheduled_at')
      .eq('email', email)
      .eq('interaction_type', 'config')
      .is('deleted_at', null)
      .not('deletion_scheduled_at', 'is', null);
      
    if (findError) {
      console.error("Error finding client for reactivation:", findError);
      return false;
    }
    
    // If no clients found with scheduled deletion, no need to do anything
    if (!clients || clients.length === 0) {
      console.log("No clients found with scheduled deletion for email:", email);
      return false;
    }
    
    console.log(`Found ${clients.length} clients scheduled for deletion. Reactivating...`);
    
    // Update each client to remove the deletion_scheduled_at date and set status to active
    for (const client of clients) {
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          deletion_scheduled_at: null,
          status: 'active'
        })
        .eq('id', client.id);
        
      if (updateError) {
        console.error(`Error reactivating client ${client.id}:`, updateError);
        continue;
      }
      
      // Log the reactivation
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          ai_agent_id: client.id,
          type: 'client_reactivated',
          metadata: {
            reactivated_at: new Date().toISOString(),
            previously_scheduled_deletion: client.deletion_scheduled_at
          }
        });
        
      if (activityError) {
        console.error("Error creating reactivation activity:", activityError);
        // Continue even if activity logging fails
      }
      
      console.log(`Successfully reactivated client: ${client.client_name}`);
    }
    
    // Show a toast notification
    toast.success("Your account has been reactivated successfully!");
    return true;
    
  } catch (error) {
    console.error("Error in reactivateClientAccount:", error);
    return false;
  }
};
