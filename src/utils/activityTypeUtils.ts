
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

/**
 * Maps extended activity types to database activity types and handles metadata enhancement
 */
export const mapActivityType = (
  activity_type: ExtendedActivityType, 
  metadata: Json = {}
): { 
  dbActivityType: ActivityType, 
  enhancedMetadata: Json 
} => {
  let dbActivityType: ActivityType;
  let enhancedMetadata = metadata;
  
  // Handle special cases that aren't in the database enum
  switch (activity_type) {
    // New enum value now exists in the database
    case "ai_agent_created":
      dbActivityType = "ai_agent_created";
      break;
      
    // Handle signed_out activity
    case "signed_out":
      dbActivityType = "client_updated";
      
      // Store the original activity type in metadata for reference
      const metadataObj = typeof metadata === 'object' && metadata !== null 
        ? metadata 
        : {};
        
      enhancedMetadata = {
        ...metadataObj,
        original_activity_type: activity_type
      } as Json;
      break;
      
    // These still need to be mapped
    case "ai_agent_updated":
    case "logo_uploaded":
    case "embed_code_copied":
    case "widget_previewed":
      // Map to a valid enum type that's closest in meaning
      dbActivityType = "ai_agent_table_created";
      
      // Store the original activity type in metadata for reference
      // Make sure metadata is an object before spreading
      const otherMetadataObj = typeof metadata === 'object' && metadata !== null 
        ? metadata 
        : {};
        
      enhancedMetadata = {
        ...otherMetadataObj,
        original_activity_type: activity_type
      } as Json;
      break;
    default:
      // For all other cases, use the activity type directly
      dbActivityType = activity_type as ActivityType;
  }
  
  return { dbActivityType, enhancedMetadata };
};
