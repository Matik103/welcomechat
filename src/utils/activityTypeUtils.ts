
import { ExtendedActivityType } from "@/types/extended-supabase";

// Maps activity types to human-readable descriptions
export const activityTypeLabels: Record<ExtendedActivityType, string> = {
  chat_interaction: "Chat Interaction",
  client_created: "Client Created",
  client_updated: "Client Updated",
  client_deleted: "Client Deleted",
  client_recovered: "Client Recovered",
  widget_settings_updated: "Widget Settings Updated",
  website_url_added: "Website URL Added",
  website_url_deleted: "Website URL Deleted",
  website_url_processed: "Website URL Processed",
  drive_link_added: "Drive Link Added",
  drive_link_deleted: "Drive Link Deleted",
  document_link_added: "Document Link Added",
  document_link_deleted: "Document Link Deleted",
  document_uploaded: "Document Uploaded",
  document_processed: "Document Processed",
  document_stored: "Document Stored",
  document_processing_started: "Document Processing Started",
  document_processing_completed: "Document Processing Completed",
  document_processing_failed: "Document Processing Failed",
  error_logged: "Error Logged",
  common_query_milestone: "Common Query Milestone",
  interaction_milestone: "Interaction Milestone",
  growth_milestone: "Growth Milestone",
  webhook_sent: "Webhook Sent",
  ai_agent_created: "AI Agent Created",
  agent_name_updated: "Agent Name Updated",
  signed_out: "Signed Out",
  embed_code_copied: "Embed Code Copied",
  logo_uploaded: "Logo Uploaded",
  system_update: "System Update",
  source_deleted: "Source Deleted",
  source_added: "Source Added",
  email_sent: "Email Sent",  // Added missing email_sent activity type
  url_deleted: "URL Deleted"  // Added url_deleted for backward compatibility
};

// Return a human-readable description for an activity
export const getActivityDescription = (type: ExtendedActivityType): string => {
  return activityTypeLabels[type] || type.replace(/_/g, ' ');
};

// Generate AI prompt for agent based on settings
export const generateAiPrompt = (
  agentName: string,
  description: string,
  clientName: string
): string => {
  return `You are ${agentName}, an AI assistant${
    description ? ` whose primary purpose is to ${description.toLowerCase()}` : ''
  }. You work for ${clientName}.
  
  Please be professional, helpful, and accurate in your responses. If you don't know the answer to a question, it's better to say so than to guess.
  
  When asked who you are, respond by saying you're ${agentName}, ${
    description ? `whose role is to ${description.toLowerCase()}` : 'an AI assistant'
  }.`;
};
