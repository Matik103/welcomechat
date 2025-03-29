
import { ClientActivity } from '@/types/activity';

export const formatActivityDescription = (activity: ClientActivity): string => {
  const { type, client_name, description } = activity;
  
  // Use the provided description if available
  if (description && description.length > 0) {
    // If the description contains "Unknown" but we have client_name, replace it
    if (description.includes('Unknown') && client_name) {
      return description.replace(/Unknown/g, client_name);
    }
    return description;
  }
  
  const activityType = type || 'unknown';
  const clientNameDisplay = client_name || 'Unknown';
  
  if (activityType.includes('client_created')) {
    return `New client "${clientNameDisplay}" was created`;
  }
  if (activityType.includes('client_updated')) {
    return `Client "${clientNameDisplay}" was updated`;
  }
  if (activityType.includes('agent_created') || activityType.includes('ai_agent_created')) {
    return `New AI agent was created for client "${clientNameDisplay}"`;
  }
  if (activityType.includes('agent_updated') || activityType.includes('ai_agent_updated')) {
    return `AI agent was updated for client "${clientNameDisplay}"`;
  }
  if (activityType.includes('website_url_added')) {
    return `Website URL was added to client "${clientNameDisplay}"`;
  }
  if (activityType.includes('document_added') || activityType.includes('document_uploaded')) {
    return `Document was added to client "${clientNameDisplay}"`;
  }
  if (activityType.includes('document_link_added')) {
    return `Document link was added to client "${clientNameDisplay}"`;
  }
  if (activityType.includes('document_link_removed') || activityType.includes('document_link_deleted')) {
    return `Document link was removed from client "${clientNameDisplay}"`;
  }
  if (activityType.includes('chat_interaction')) {
    return `Chat interaction with client "${clientNameDisplay}"`;
  }
  
  return `${activityType.replace(/_/g, ' ')} for ${clientNameDisplay}`;
};
