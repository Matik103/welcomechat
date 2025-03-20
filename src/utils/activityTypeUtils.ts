import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

/**
 * Maps the extended activity type to a valid database activity type
 * @param extendedType The extended activity type that may not exist in the database enum
 * @param metadata Optional metadata to enhance
 * @returns An object with the mapped database activity type and enhanced metadata
 */
export const mapActivityType = (
  extendedType: ExtendedActivityType,
  metadata: Json = {}
): { dbActivityType: ActivityType; enhancedMetadata: Json } => {
  // Start with the original metadata or an empty object
  const metadataObj = 
    typeof metadata === 'object' && metadata !== null ? 
    { ...metadata } : 
    {};
  
  // Default to client_updated as a fallback activity type
  let dbActivityType: ActivityType = "client_updated";
  
  // Add the original type to metadata for reference
  (metadataObj as Record<string, any>).original_activity_type = extendedType;
  
  // Map extended types to database types
  switch (extendedType) {
    // Direct mappings (these already exist in the database enum)
    case "client_created":
    case "client_updated":
    case "client_deleted":
    case "client_recovered":
    case "webhook_sent":
    case "email_sent":
    case "system_update":
    case "ai_agent_created":
    case "ai_agent_updated":
    case "chat_interaction":
    case "agent_error":
    case "schema_update":
    case "drive_link_added":
    case "drive_link_deleted":
    case "website_url_added":
    case "url_deleted":
    case "document_link_added":
    case "document_link_deleted":
    case "document_uploaded":
    case "signed_out":
    case "embed_code_copied":
    case "widget_previewed":
    case "logo_uploaded":
    case "document_stored":
    case "document_processed":
    case "document_processing_started":
    case "document_processing_completed":
    case "document_processing_failed":
    case "invitation_sent":
    case "invitation_accepted":
      // These types already exist in the database enum
      dbActivityType = extendedType as ActivityType;
      break;
      
    // Extended types that need mapping
    case "agent_name_updated":
      dbActivityType = "ai_agent_updated";
      (metadataObj as Record<string, any>).field_updated = "agent_name";
      break;
      
    case "error_logged":
      dbActivityType = "system_update";
      (metadataObj as Record<string, any>).error_type = extendedType;
      break;
      
    // Default case - use client_updated as a safe fallback
    default:
      dbActivityType = "client_updated";
      (metadataObj as Record<string, any>).unmapped_type = extendedType;
      console.warn(`Unmapped activity type "${extendedType}" defaulting to "client_updated"`);
  }
  
  return {
    dbActivityType,
    enhancedMetadata: metadataObj as Json
  };
};

/**
 * Generates an AI prompt based on the agent name, description, and client name
 * @param agentName The name of the AI agent
 * @param agentDescription Optional description of the AI agent
 * @param clientName Optional name of the client
 * @returns A formatted AI prompt string
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
  
  // Sanitize inputs to be extra safe
  const sanitizedAgentName = agentName.replace(/"/g, "'");
  const sanitizedClientName = clientName ? clientName.replace(/"/g, "'") : "your organization";
  const sanitizedDescription = agentDescription ? agentDescription.replace(/"/g, "'") : "";
  
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
