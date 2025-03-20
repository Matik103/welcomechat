
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/extended-supabase";
import { Json } from "@/integrations/supabase/types";

/**
 * Creates a client activity entry in the database
 */
export const createClientActivity = async (
  client_id: string,
  activity_type: ExtendedActivityType,
  description: string,
  metadata?: Json
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_activities')
      .insert({
        client_id,
        activity_type: activity_type as unknown as string, // Type cast to match Supabase expectations
        description,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Error creating client activity:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error in createClientActivity:', err);
    throw err;
  }
};

/**
 * Fetches recent client activities
 */
export const fetchRecentActivities = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select(`
        id,
        client_id,
        activity_type,
        description,
        created_at,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }

    // Enhance activities with client names
    const activities = await enhanceActivitiesWithClientNames(data || []);
    
    return activities;
  } catch (err) {
    console.error('Error in fetchRecentActivities:', err);
    throw err;
  }
};

/**
 * Enhances activities with client names from ai_agents
 */
const enhanceActivitiesWithClientNames = async (activities: any[]) => {
  if (!activities.length) return [];
  
  // Get all unique client IDs
  const clientIds = [...new Set(activities.map(a => a.client_id))];
  
  try {
    // Fetch client names from ai_agents where interaction_type = 'config'
    const { data: clients } = await supabase
      .from('ai_agents')
      .select('client_id, name')
      .in('client_id', clientIds)
      .eq('interaction_type', 'config');
    
    // Create a map of client IDs to names
    const clientNameMap = new Map();
    clients?.forEach(client => {
      if (client.client_id) {
        clientNameMap.set(client.client_id, client.name);
      }
    });
    
    // Add client name to each activity
    return activities.map(activity => ({
      ...activity,
      client_name: clientNameMap.get(activity.client_id) || 'Unknown Client'
    }));
  } catch (error) {
    console.error('Error enhancing activities with client names:', error);
    return activities;
  }
};
