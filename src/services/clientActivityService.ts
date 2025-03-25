
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { callRpcFunction } from '@/utils/rpcUtils';

/**
 * Creates a client activity record
 * @param clientId The client ID
 * @param activity_type The type of activity
 * @param description Description of the activity
 * @param metadata Additional metadata for the activity
 * @returns The created activity
 */
export const createClientActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required for activity logging');
    }

    // Use callRpcFunction to avoid type checking issues
    const result = await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activity_type,
      description_param: description,
      metadata_param: metadata
    });

    return result;
  } catch (error) {
    console.error('Error creating client activity:', error);
    throw error;
  }
};

// Alternative direct database insert method
export const logActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    // Convert the ActivityType to a string to satisfy TypeScript
    // This is a workaround for the type mismatch between our app's ActivityType and the database enum
    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: activity_type as any,
        description,
        metadata
      });

    if (error) {
      console.error("Error logging activity:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error in logActivity:', err);
    throw err;
  }
};
