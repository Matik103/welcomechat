
import { supabase } from '@/integrations/supabase/client';
import { ExtendedActivityType } from '@/types/activity';
import type { Json } from '@/integrations/supabase/types';
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
  activity_type: ExtendedActivityType,
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

// This is a temporary function to directly insert into the activities table
// when the RPC function is not available or for testing purposes
export const createActivityDirect = async (
  clientId: string,
  activityType: ExtendedActivityType,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    // Insert directly into client_activities table with a type cast for activity_type
    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: activityType as any, // Type cast to avoid TS errors with enum
        description: description,
        metadata: metadata as Json
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity directly:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating activity directly:', error);
    throw error;
  }
};
