
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { Database } from "@/integrations/supabase/types";
import { mapActivityType } from "@/utils/activityTypeUtils";

// Define the proper role type based on the database schema
type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Creates a client activity record in the database
 */
export const createClientActivity = async (
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata: Json = {}
): Promise<void> => {
  try {
    // First check if this might be a duplicate activity to prevent rare race conditions
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType,
      description,
      metadata
    });
    
    if (error) {
      console.error("Failed to log activity:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error creating client activity:", error);
    throw error;
  }
};

/**
 * Creates a record in ai_agents table for chat interactions
 */
export const logChatInteraction = async (
  clientId: string,
  agentName: string,
  queryText: string,
  responseText: string,
  responseTimeMs: number = 0,
  metadata: Json = {}
): Promise<void> => {
  try {
    // Enhance metadata
    const metadataObj = typeof metadata === 'object' ? metadata : {};
    const enhancedMetadata = {
      ...metadataObj,
      type: 'chat_interaction',
      query: queryText,
      response_time_ms: responseTimeMs,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase.from("ai_agents").insert({
      client_id: clientId,
      name: agentName,
      content: responseText,
      query_text: queryText,
      interaction_type: 'chat_interaction',
      response_time_ms: responseTimeMs,
      settings: enhancedMetadata,
      is_error: false
    });
    
    if (error) {
      console.error("Failed to log chat interaction:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error logging chat interaction:", error);
    throw error;
  }
};

/**
 * Logs an error in the AI agent
 */
export const logAgentError = async (
  clientId: string,
  agentName: string,
  errorType: string,
  errorMessage: string,
  queryText?: string,
  metadata: Json = {}
): Promise<void> => {
  try {
    // Enhance metadata
    const metadataObj = typeof metadata === 'object' ? metadata : {};
    const enhancedMetadata = {
      ...metadataObj,
      type: 'error',
      error_type: errorType,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase.from("ai_agents").insert({
      client_id: clientId,
      name: agentName,
      content: errorMessage,
      query_text: queryText || '',
      interaction_type: 'error',
      error_type: errorType,
      error_message: errorMessage,
      error_status: 'pending',
      settings: enhancedMetadata,
      is_error: true
    });
    
    if (error) {
      console.error("Failed to log agent error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error logging agent error:", error);
    throw error;
  }
};

/**
 * Utility to check if a user role exists before creating it
 */
export const ensureUserRole = async (
  userId: string,
  role: AppRole,
  clientId?: string
): Promise<void> => {
  try {
    // Use upsert instead of insert to handle the unique constraint
    // This will update if the role exists or insert if it doesn't
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: role,
          client_id: clientId
        },
        { 
          onConflict: 'user_id,role', 
          ignoreDuplicates: false // Update if exists
        }
      );
    
    if (error) {
      console.error("Role creation/update error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error ensuring user role:", error);
    throw error;
  }
};
