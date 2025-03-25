
import { ActivityType } from "@/types/client-form";

/**
 * Maps activity types to human-readable descriptions
 */
export const activityTypeDescriptions: Record<ActivityType, string> = {
  chat_interaction: "Chat interaction",
  client_created: "Client created",
  client_updated: "Client updated",
  client_deleted: "Client deleted",
  client_recovered: "Client recovered",
  widget_settings_updated: "Widget settings updated",
  website_url_added: "Website URL added",
  website_url_deleted: "Website URL deleted",
  website_url_processed: "Website URL processed",
  drive_link_added: "Google Drive link added",
  drive_link_deleted: "Google Drive link deleted",
  document_link_added: "Document link added",
  document_link_deleted: "Document link deleted",
  document_uploaded: "Document uploaded",
  document_processed: "Document processed",
  document_stored: "Document stored",
  document_processing_started: "Document processing started",
  document_processing_completed: "Document processing completed",
  document_processing_failed: "Document processing failed",
  error_logged: "Error logged",
  common_query_milestone: "Common query milestone",
  interaction_milestone: "Interaction milestone",
  growth_milestone: "Growth milestone",
  webhook_sent: "Webhook sent",
  ai_agent_created: "AI agent created",
  ai_agent_updated: "AI agent updated",
  ai_agent_table_created: "AI agent table created",
  agent_name_updated: "Agent name updated",
  agent_description_updated: "Agent description updated",
  agent_error: "Agent error",
  agent_logo_updated: "Agent logo updated",
  agent_updated: "Agent updated",
  signed_out: "Signed out",
  embed_code_copied: "Embed code copied",
  logo_uploaded: "Logo uploaded",
  system_update: "System update",
  source_deleted: "Source deleted",
  source_added: "Source added",
  url_deleted: "URL deleted",
  email_sent: "Email sent",
  invitation_sent: "Invitation sent",
  invitation_accepted: "Invitation accepted",
  widget_previewed: "Widget previewed",
  user_role_updated: "User role updated",
  login_success: "Login success",
  login_failed: "Login failed",
  openai_assistant_document_added: "OpenAI assistant document added",
  openai_assistant_upload_failed: "OpenAI assistant upload failed",
  schema_update: "Schema update"
};

/**
 * Gets a human-readable description for an activity type
 */
export const getActivityTypeDescription = (type: ActivityType): string => {
  return activityTypeDescriptions[type] || type;
};

/**
 * Generates an AI prompt from client data
 */
export const generateAiPrompt = (
  agentName: string, 
  agentDescription?: string,
  clientName?: string
): string => {
  let prompt = `You are ${agentName}`;
  
  if (clientName) {
    prompt += `, an AI assistant for ${clientName}`;
  }
  
  if (agentDescription) {
    prompt += `. ${agentDescription}`;
  }
  
  prompt += ". Answer customer questions helpfully and professionally.";
  
  return prompt;
};
