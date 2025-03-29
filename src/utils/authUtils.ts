
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ActivityType } from '@/types/activity';

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
      
      // Log the reactivation as an activity
      try {
        // Insert directly into ai_agents table with activity_log interaction_type
        const { error: activityError } = await supabase
          .from('ai_agents')
          .insert({
            client_id: client.id,
            interaction_type: 'activity_log',
            name: 'Activity Logger',
            type: 'client_reactivated',
            content: `Client account reactivated: ${client.client_name}`,
            metadata: {
              reactivated_at: new Date().toISOString(),
              previously_scheduled_deletion: client.deletion_scheduled_at
            }
          });
          
        if (activityError) {
          console.error("Error creating reactivation activity:", activityError);
        }
      } catch (activityError) {
        console.error("Error logging reactivation activity:", activityError);
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

/**
 * Creates a user role for the specified user
 * @param userId The user ID to assign the role to
 * @param role The role to assign (admin, client, etc)
 * @returns True if successful, false otherwise
 */
export const createUserRole = async (userId: string, role: 'admin' | 'client'): Promise<boolean> => {
  if (!userId || !role) {
    console.error("Invalid parameters: userId and role are required");
    return false;
  }

  try {
    // Check if user already has this role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing role:", checkError);
      return false;
    }

    // If role already exists, return success
    if (existingRole) {
      console.log(`User ${userId} already has role ${role}`);
      return true;
    }

    // Insert the new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ 
        user_id: userId, 
        role: role 
      });

    if (insertError) {
      console.error("Error creating user role:", insertError);
      return false;
    }

    console.log(`Successfully assigned role ${role} to user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error in createUserRole:", error);
    return false;
  }
};
