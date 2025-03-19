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
      
    // New enum value now exists in the database  
    case "ai_agent_updated":
      dbActivityType = "ai_agent_updated";
      break;
      
    // Document-related activities
    case "document_link_added":
    case "document_uploaded":
    case "document_link_deleted":
      // Map to "document_updated" or another relevant existing enum value
      dbActivityType = "ai_agent_table_created";
      
      // Store the original activity type in metadata for reference
      const documentMetadataObj = typeof metadata === 'object' && metadata !== null 
        ? metadata 
        : {};
        
      enhancedMetadata = {
        ...documentMetadataObj,
        original_activity_type: activity_type
      } as Json;
      break;
      
    // Map system_update to client_updated which is a stable enum value
    case "system_update":
      dbActivityType = "system_update";
      break;
      
    // Map new document processing activities to a reliable enum that exists
    case "document_processing_started":
    case "document_processing_completed":
    case "document_processing_failed":
      // Use client_updated which is a stable enum value
      dbActivityType = "client_updated";
      
      // Store the original activity type in metadata for reference
      const processingMetadataObj = typeof metadata === 'object' && metadata !== null 
        ? metadata 
        : {};
        
      enhancedMetadata = {
        ...processingMetadataObj,
        original_activity_type: activity_type
      } as Json;
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

/**
 * Generates a standardized AI prompt from agent name and description
 */
export const generateAiPrompt = (agentName: string, agentDescription: string): string => {
  // Create a default prompt if no description is provided
  if (!agentDescription || agentDescription.trim() === '') {
    return `You are ${agentName}, a helpful AI assistant. Your goal is to provide clear, concise, and accurate information to users.`;
  }
  
  // Generate a prompt with the agent's name and description
  return `You are ${agentName}. ${agentDescription}

As an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;
}
