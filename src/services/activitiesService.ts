
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityTypeString } from "@/types/activity";
import { getSafeActivityType } from "@/utils/activityTypeUtils";

/**
 * Create an activity record in the activities table
 */
export const createActivity = async (
  clientId: string,
  type: ActivityType | ActivityTypeString,
  description: string,
  metadata: any = {}
): Promise<{ success: boolean; error: any | null }> => {
  try {
    // First, try to get client name if not provided in metadata
    if (!metadata.client_name) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('client_name')
        .eq('id', clientId)
        .single();
        
      if (clientData?.client_name) {
        metadata.client_name = clientData.client_name;
      }
    }
    
    // Get agent name if not provided
    if (!metadata.agent_name) {
      const { data: agentData } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .maybeSingle();
        
      if (agentData?.name) {
        metadata.agent_name = agentData.name;
      }
    }
    
    // Convert the ActivityType enum to a string value acceptable by the database
    const safeActivityType = getSafeActivityType(typeof type === 'string' ? type : String(type));
    
    // Insert activity record without type assertion, using string literal
    const { error } = await supabase
      .from('activities')
      .insert({
        ai_agent_id: clientId,
        type: safeActivityType, // Using string directly without type assertion
        description,
        metadata,
        created_at: new Date().toISOString()
      } as any); // Use 'as any' to bypass TypeScript's type checking for this insert
      
    if (error) {
      console.error("Error creating activity:", error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error in createActivity:", error);
    return { success: false, error };
  }
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (
  limit: number = 20
): Promise<{ success: boolean; data?: any[]; error?: Error }> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
};
