
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

/**
 * Maps the extended activity types to standard activity types that exist in the database
 * and enhances metadata with the original type information when needed
 */
export const mapActivityType = (
  extendedType: ExtendedActivityType,
  metadata: Json = {}
): { dbActivityType: ActivityType; enhancedMetadata: Json } => {
  // Ensure metadata is an object
  const metadataObj = typeof metadata === 'object' && metadata !== null 
    ? metadata 
    : {};

  // Convert metadata to a mutable object if it's not already
  const enhancedMetadata = { ...(metadataObj as Record<string, any>) };

  // Map extended types to database types
  let dbActivityType: ActivityType;

  switch (extendedType) {
    // Map custom extended types to standard activity types
    case "agent_name_updated":
      dbActivityType = "client_updated";
      enhancedMetadata.original_type = "agent_name_updated";
      break;
      
    case "error_logged":
      dbActivityType = "system_update";
      enhancedMetadata.original_type = "error_logged";
      break;
      
    case "agent_error":
      dbActivityType = "system_update";
      enhancedMetadata.original_type = "agent_error";
      enhancedMetadata.is_error = true;
      break;
      
    // For standard activity types, use as-is
    default:
      // Type assertion to cast ExtendedActivityType to ActivityType
      // This is safe because our default case handles all standard ActivityType values
      dbActivityType = extendedType as ActivityType;
  }

  // Add timestamp to metadata if not already present
  if (!enhancedMetadata.timestamp) {
    enhancedMetadata.timestamp = new Date().toISOString();
  }

  return { dbActivityType, enhancedMetadata };
};

/**
 * Formats activity type string for display
 * Converts camelCase or snake_case to Title Case with spaces
 */
export const formatActivityType = (type: string): string => {
  if (!type) return '';
  
  // Convert to Title Case with spaces
  return type
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Trim leading space if any, and capitalize first letter of each word
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
