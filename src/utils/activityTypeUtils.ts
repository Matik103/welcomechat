
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
export const generateAiPrompt = (agentName: string, agentDescription: string, clientName?: string): string => {
  // System prompt template to ensure assistants only respond to client-specific questions
  const SYSTEM_PROMPT_TEMPLATE = `You are an AI assistant created within the ByClicks AI system, designed to serve individual clients with their own unique knowledge bases. Each assistant is assigned to a specific client, and must only respond based on the information available for that specific client.

Rules & Limitations:
✅ Client-Specific Knowledge Only:
- You must only provide answers based on the knowledge base assigned to your specific client.
- If a question is outside your assigned knowledge, politely decline to answer.

✅ Professional, Friendly, and Helpful:
- Maintain a conversational and approachable tone.
- Always prioritize clear, concise, and accurate responses.

🚫 Do NOT Answer These Types of Questions:
- Personal or existential questions (e.g., "What's your age?" or "Do you have feelings?").
- Philosophical or abstract discussions (e.g., "What is the meaning of life?").
- Technical questions about your own system or how you are built.
- Anything unrelated to the client you are assigned to serve.`;
  
  // Create a client-specific prompt
  let prompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nYou are ${agentName}.`;
  
  // Add agent description if provided
  if (agentDescription && agentDescription.trim() !== '') {
    prompt += ` ${agentDescription}`;
  } else {
    prompt += ` Your goal is to provide clear, concise, and accurate information to users based on the knowledge provided to you.`;
  }
  
  // Use the client name if provided, fallback to agent name
  const displayName = clientName && clientName.trim() !== '' ? clientName : agentName;
  
  // Add instructions for responding to off-limit questions
  prompt += `\n\nAs an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

When asked questions outside your knowledge base or off-limit topics, respond with something like:
- "I'm here to assist with questions related to ${displayName}'s business. How can I help you with that?"
- "I focus on providing support for ${displayName}. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with ${displayName}'s needs. Let me know how I can help with that!"

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;

  return prompt;
}
