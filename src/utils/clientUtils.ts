import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { toast } from 'sonner';

/**
 * Deletes a client and all associated data
 */
export const deleteClientAndRelatedData = async (clientId: string): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured');
    return false;
  }

  try {
    console.log(`Attempting to delete client and related data for client ID: ${clientId}`);

    // 1. Delete website URLs
    console.log('Deleting website URLs...');
    const { error: websiteError } = await supabaseAdmin
      .from('website_urls')
      .delete()
      .eq('client_id', clientId);

    if (websiteError) {
      console.error('Error deleting website URLs:', websiteError);
      toast.error(`Error deleting website URLs: ${websiteError.message}`);
      return false;
    }

    // 2. Delete documents
    console.log('Deleting documents...');
    const { error: documentsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('client_id', clientId);

    if (documentsError) {
      console.error('Error deleting documents:', documentsError);
      toast.error(`Error deleting documents: ${documentsError.message}`);
      return false;
    }

    // 3. Delete common queries
    console.log('Deleting common queries...');
    const { error: queriesError } = await supabaseAdmin
      .from('common_queries')
      .delete()
      .eq('client_id', clientId);

    if (queriesError) {
      console.error('Error deleting common queries:', queriesError);
      toast.error(`Error deleting common queries: ${queriesError.message}`);
      return false;
    }

    // 4. Delete client activities
    console.log('Deleting client activities...');
    const { error: activitiesError } = await supabaseAdmin
      .from('client_activities')
      .delete()
      .eq('client_id', clientId);

    if (activitiesError) {
      console.error('Error deleting client activities:', activitiesError);
      toast.error(`Error deleting client activities: ${activitiesError.message}`);
      return false;
    }

    // 5. Delete the AI agent (client)
    console.log('Deleting AI agent...');
    const { error: agentError } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');

    if (agentError) {
      console.error('Error deleting AI agent:', agentError);
      toast.error(`Error deleting AI agent: ${agentError.message}`);
      return false;
    }

    console.log('Client and related data deleted successfully');
    toast.success('Client and related data deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteClientAndRelatedData:', error);
    toast.error(`Error deleting client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Schedules a client for deletion by setting the deletion_scheduled_at timestamp
 */
export const scheduleClientDeletion = async (clientId: string): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured');
    return false;
  }

  try {
    console.log(`Scheduling client ${clientId} for deletion...`);
    const deletionTime = new Date();
    deletionTime.setDate(deletionTime.getDate() + 7); // Schedule for 7 days from now

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .update({ deletion_scheduled_at: deletionTime.toISOString() })
      .eq('id', clientId)
      .eq('interaction_type', 'config');

    if (error) {
      console.error('Error scheduling client deletion:', error);
      toast.error(`Error scheduling client deletion: ${error.message}`);
      return false;
    }

    console.log(`Client ${clientId} scheduled for deletion on ${deletionTime.toISOString()}`);
    toast.success(`Client scheduled for deletion on ${deletionTime.toLocaleDateString()}`);
    return true;
  } catch (error) {
    console.error('Error in scheduleClientDeletion:', error);
    toast.error(`Error scheduling client deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Cancels a scheduled client deletion by clearing the deletion_scheduled_at timestamp
 */
export const cancelScheduledClientDeletion = async (clientId: string): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured');
    return false;
  }

  try {
    console.log(`Cancelling scheduled deletion for client ${clientId}...`);

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .update({ deletion_scheduled_at: null })
      .eq('id', clientId)
      .eq('interaction_type', 'config');

    if (error) {
      console.error('Error cancelling scheduled deletion:', error);
      toast.error(`Error cancelling scheduled deletion: ${error.message}`);
      return false;
    }

    console.log(`Scheduled deletion cancelled for client ${clientId}`);
    toast.success('Scheduled deletion cancelled');
    return true;
  } catch (error) {
    console.error('Error in cancelScheduledClientDeletion:', error);
    toast.error(`Error cancelling client deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Permanently deletes a client from the database, including all associated data.
 * This function is intended to be run by a background job after the deletion_scheduled_at time has passed.
 */
export const performPermanentClientDeletion = async (clientId: string): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured');
    return false;
  }

  try {
    console.log(`Performing permanent deletion for client ${clientId}...`);

    // 1. Delete website URLs
    const { error: websiteError } = await supabaseAdmin
      .from('website_urls')
      .delete()
      .eq('client_id', clientId);

    if (websiteError) {
      console.error('Error deleting website URLs:', websiteError);
      return false;
    }

    // 2. Delete documents
    const { error: documentsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('client_id', clientId);

    if (documentsError) {
      console.error('Error deleting documents:', documentsError);
      return false;
    }

    // 3. Delete common queries
    const { error: queriesError } = await supabaseAdmin
      .from('common_queries')
      .delete()
      .eq('client_id', clientId);

    if (queriesError) {
      console.error('Error deleting common queries:', queriesError);
      return false;
    }

    // 4. Delete client activities
    const { error: activitiesError } = await supabaseAdmin
      .from('client_activities')
      .delete()
      .eq('client_id', clientId);

    if (activitiesError) {
      console.error('Error deleting client activities:', activitiesError);
      return false;
    }

    // 5. Delete the AI agent (client)
    const { error: agentError } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');

    if (agentError) {
      console.error('Error deleting AI agent:', agentError);
      return false;
    }

    console.log(`Client ${clientId} permanently deleted`);
    return true;
  } catch (error) {
    console.error('Error in performPermanentClientDeletion:', error);
    return false;
  }
};

/**
 * Updates the status of a client
 */
export const updateClientStatus = async (clientId: string, status: string): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not configured');
    return false;
  }

  try {
    console.log(`Updating status of client ${clientId} to ${status}...`);

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .update({ status })
      .eq('id', clientId)
      .eq('interaction_type', 'config');

    if (error) {
      console.error('Error updating client status:', error);
      toast.error(`Error updating client status: ${error.message}`);
      return false;
    }

    console.log(`Client ${clientId} status updated to ${status}`);
    toast.success('Client status updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateClientStatus:', error);
    toast.error(`Error updating client status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
