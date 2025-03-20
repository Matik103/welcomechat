
import { ActivityType } from "@/types/activity";

/**
 * Generates a descriptive message based on the activity type
 */
export const getActivityTypeMessage = (type: ActivityType, details: any = {}): string => {
  switch (type) {
    case "client_created":
      return "New client added";
    case "client_updated":
      return details?.field 
        ? `Updated client ${details.field}` 
        : "Updated client information";
    case "client_deleted":
      return "Client scheduled for deletion";
    case "client_recovered":
      return "Client recovered from deletion";
    case "widget_settings_updated":
      return "Chat widget settings updated";
    case "website_url_added":
      return "Added website URL";
    case "drive_link_added":
      return "Added Google Drive link";
    case "url_deleted":
      return "Removed website URL";
    case "drive_link_deleted":
      return "Removed Google Drive link";
    case "chat_interaction":
      return "New chat interaction";
    case "invitation_sent":
      return "Sent invitation";
    case "invitation_accepted":
      return "Invitation accepted";
    case "webhook_sent":
      return "Sent webhook notification";
    case "document_stored":
      return "Document stored for processing";
    case "document_processed":
      return "Document processed successfully";
    case "ai_agent_created":
      return "AI agent created";
    case "ai_agent_updated":
      return "AI agent updated";
    case "logo_uploaded":
      return "Logo uploaded";
    case "system_update":
      return "System update completed";
    case "document_link_added":
      return "Document link added";
    case "document_link_deleted":
      return "Document link removed";
    case "document_uploaded":
      return "Document uploaded";
    case "document_processing_started":
      return "Document processing started";
    case "document_processing_completed":
      return "Document processing completed";
    case "document_processing_failed":
      return "Document processing failed";
    case "signed_out":
      return "User signed out";
    case "embed_code_copied":
      return "Widget embed code copied";
    case "widget_previewed":
      return "Chat widget previewed";
    default:
      return `${type.replace(/_/g, ' ')}`;
  }
};

// Function to generate an AI prompt based on the agent name and description
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
  let prompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nYou are ${agentName || 'AI Assistant'}, an AI assistant for ${clientName || 'your client'}.`;
  
  // Add agent description if provided
  if (agentDescription && agentDescription.trim() !== '') {
    prompt += ` ${agentDescription}`;
  } else {
    prompt += ` Your goal is to provide clear, concise, and accurate information to users based on the knowledge provided to you.`;
  }
  
  // Add instructions for responding to off-limit questions
  prompt += `\n\nAs an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

When asked questions outside your knowledge base or off-limit topics, respond with something like:
- "I'm here to assist with questions related to ${clientName || 'this client'}'s business. How can I help you with that?"
- "I focus on providing support for ${clientName || 'this client'}. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with ${clientName || 'this client'}'s needs. Let me know how I can help with that!"

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;

  return prompt;
};
