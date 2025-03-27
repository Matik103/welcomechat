
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { Json } from '@/integrations/supabase/types';

/**
 * Creates a new client activity record in the database
 * 
 * @param clientId The client ID
 * @param activity_type The type of activity
 * @param description A description of the activity
 * @param metadata Additional metadata (optional)
 * @returns The created activity record
 */
export const createClientActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    // Validate client ID
    if (!clientId) {
      throw new Error('Client ID is required to log activity');
    }

    // Validate activity type
    const validActivityType = activity_type;
    if (!validActivityType) {
      throw new Error(`Invalid activity type: ${activity_type}`);
    }
    
    // Insert activity record - We need to cast the activity_type as any to avoid TypeScript errors
    // This is because the supabase types are expecting the exact enum type from the database
    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: validActivityType as any, // Cast to any to bypass TypeScript checking
        description,
        metadata: metadata as Json
      });

    if (error) {
      console.error('Error creating client activity:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createClientActivity:', error);
    throw error;
  }
};

/**
 * Gets recent client activities for all clients
 * 
 * @param limit Maximum number of activities to return
 * @returns A list of recent activities with client information
 */
export const getRecentActivities = async (limit = 20): Promise<any[]> => {
  try {
    // Fetch recent activities
    const { data: activities, error } = await supabase
      .from('client_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }

    // Get client information for each activity
    const enrichedActivities = await Promise.all(
      (activities || []).map(async (activity) => {
        if (!activity.client_id) {
          return { ...activity, client_name: 'Unknown' };
        }

        // Use the correct FROM syntax for the Supabase client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, client_name')
          .eq('id', activity.client_id)
          .single();

        if (clientError || !clientData) {
          console.log(`Client not found for ID: ${activity.client_id}`);
          return { ...activity, client_name: 'Unknown' };
        }

        return { ...activity, client_name: clientData.client_name };
      })
    );

    return enrichedActivities;
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
};

/**
 * Gets activities for a specific client
 * 
 * @param clientId The client ID
 * @param limit Maximum number of activities to return
 * @returns A list of client activities
 */
export const getClientActivities = async (clientId: string, limit = 50): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client activities:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClientActivities:', error);
    return [];
  }
};

/**
 * Counts activities by type for a specific client
 * 
 * @param clientId The client ID
 * @returns A record of activity counts by type
 */
export const countActivitiesByType = async (clientId: string): Promise<Record<string, number>> => {
  try {
    // Since groupBy is not available in the Supabase client,
    // we'll fetch all activities and count them ourselves
    const { data, error } = await supabase
      .from('client_activities')
      .select('activity_type')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error counting activities by type:', error);
      throw error;
    }

    // Count activities by type manually
    const counts: Record<string, number> = {};
    (data || []).forEach((activity) => {
      const type = activity.activity_type;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error in countActivitiesByType:', error);
    return {};
  }
};
