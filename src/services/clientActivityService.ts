
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { Database } from "@/integrations/supabase/types";
import { mapActivityType } from "@/utils/activityTypeUtils";
import { toast } from "sonner";

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
    console.log("Creating activity:", {
      client_id: clientId,
      activity_type: activityType,
      description,
      metadata
    });
    
    // Create the activity record
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType as any, // Type casting to bypass strict type-checking
      description,
      metadata
    });
    
    if (error) {
      console.error("Failed to log activity:", error);
      // If the error is related to an invalid enum value, fallback to a known valid enum value
      if (error.code === '22P02' && error.message.includes('activity_type_enum')) {
        console.warn("Invalid activity type detected, falling back to client_updated");
        
        // Fall back to a reliable activity type
        const fallbackType: ActivityType = "client_updated";
        
        // Update metadata to include the original intended type
        const enhancedMetadata = {
          ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
          original_intended_type: activityType,
          fallback_reason: "Invalid enum value"
        };
        
        // Try again with the fallback type
        const { error: fallbackError } = await supabase.from("client_activities").insert({
          client_id: clientId,
          activity_type: fallbackType as any,
          description,
          metadata: enhancedMetadata
        });
        
        if (fallbackError) {
          console.error("Failed to log activity even with fallback:", fallbackError);
          toast.error("Failed to record activity. Please try again.");
          throw fallbackError;
        }
      } else {
        toast.error("Failed to record activity. Please try again.");
        throw error;
      }
    }
  } catch (error) {
    console.error("Error creating client activity:", error);
    // Don't rethrow to prevent UI disruption
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
    // Ensure metadata is an object
    const metadataObj = typeof metadata === 'object' && metadata !== null ? metadata : {};
    
    // Enhance metadata
    const enhancedMetadata = {
      ...(metadataObj as Record<string, any>),
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
      toast.error("Failed to record chat interaction");
      throw error;
    }
  } catch (error) {
    console.error("Error logging chat interaction:", error);
    // Don't rethrow to prevent UI disruption
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
    // Ensure metadata is an object
    const metadataObj = typeof metadata === 'object' && metadata !== null ? metadata : {};
    
    // Enhance metadata
    const enhancedMetadata = {
      ...(metadataObj as Record<string, any>),
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
      toast.error("Failed to record agent error");
      throw error;
    } else {
      // Only show toast for errors that users should know about
      toast.error(`Agent error: ${errorType}`, {
        description: errorMessage.substring(0, 100) + (errorMessage.length > 100 ? '...' : '')
      });
    }
  } catch (error) {
    console.error("Error logging agent error:", error);
    // Don't rethrow to prevent UI disruption
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
      toast.error("Failed to update user role");
      throw error;
    } else {
      toast.success("User role updated successfully");
    }
  } catch (error) {
    console.error("Error ensuring user role:", error);
    toast.error("Failed to update user role");
    throw error;
  }
};
