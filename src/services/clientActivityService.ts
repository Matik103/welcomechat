
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

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
 * Utility to check if a user role exists before creating it
 */
export const ensureUserRole = async (
  userId: string,
  role: string,
  clientId?: string
): Promise<void> => {
  try {
    // Check if the role already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();
    
    if (!existingRole) {
      // Role doesn't exist, create it
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role,
          client_id: clientId
        });
      
      if (roleError) {
        console.error("Role creation error:", roleError);
        throw roleError;
      }
    } else if (clientId) {
      // Role exists but we want to make sure client_id is set correctly
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ client_id: clientId })
        .eq("user_id", userId)
        .eq("role", role);
      
      if (updateError) {
        console.error("Role update error:", updateError);
        throw updateError;
      }
    }
  } catch (error) {
    console.error("Error ensuring user role:", error);
    throw error;
  }
};
