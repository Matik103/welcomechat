
/**
 * Activity types and related definitions
 */

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  CHAT_MESSAGE = 'chat_message',
  CHAT_RESPONSE = 'chat_response',
  PROFILE_UPDATED = 'profile_updated',
  SETTINGS_UPDATED = 'settings_updated'
}

export type ActivityTypeString = keyof typeof ActivityType;

export interface ClientActivity {
  id: string;
  client_id: string;
  user_id?: string;
  agent_id?: string;
  activity_type: ActivityTypeString;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
  client_name?: string;
  agent_name?: string;
  username?: string;
}

export interface ActivityFilter {
  clientId?: string;
  agentId?: string;
  userId?: string;
  activityType?: ActivityTypeString;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityCount {
  activity_type: ActivityTypeString;
  count: number;
}

export interface ActivityChartData {
  activity_type: ActivityTypeString;
  count: number;
  date: string;
}
