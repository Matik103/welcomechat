
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

/**
 * Generates an AI prompt based on the agent name, description, and client name
 * Used for creating or updating AI agents
 */
export const generateAiPrompt = (
  agentName: string,
  agentDescription: string,
  clientName?: string
): string => {
  // Sanitize inputs to prevent issues
  const sanitizedAgentName = (agentName || 'AI Assistant').replace(/"/g, "'").replace(/\\/g, "\\\\");
  const sanitizedClientName = (clientName || 'the client').replace(/"/g, "'").replace(/\\/g, "\\\\");
  const sanitizedDescription = (agentDescription || '').replace(/"/g, "'").replace(/\\/g, "\\\\");
  
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
  let prompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nYou are ${sanitizedAgentName}, an AI assistant for ${sanitizedClientName}.`;
  
  // Add agent description if provided
  if (sanitizedDescription && sanitizedDescription.trim() !== '') {
    prompt += ` ${sanitizedDescription}`;
  } else {
    prompt += ` Your goal is to provide clear, concise, and accurate information to users based on the knowledge provided to you.`;
  }
  
  // Add instructions for responding to off-limit questions
  prompt += `\n\nAs an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

When asked questions outside your knowledge base or off-limit topics, respond with something like:
- "I'm here to assist with questions related to ${sanitizedClientName}'s business. How can I help you with that?"
- "I focus on providing support for ${sanitizedClientName}. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with ${sanitizedClientName}'s needs. Let me know how I can help with that!"

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;

  return prompt;
};
