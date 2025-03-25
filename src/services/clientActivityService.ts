
import { supabase } from '@/integrations/supabase/client';
import { ExtendedActivityType } from '@/types/activity';
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

/**
 * Legacy alias for createClientActivity to maintain backward compatibility
 */
export const createClientActivityLog = createClientActivity;
