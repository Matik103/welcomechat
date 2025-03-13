import { Database as GeneratedDatabase } from './supabase-types';

export interface AIAgentBase {
  id: string;
  client_id: string;
  agent_name: string;
  client_name: string;
  email: string;
  personality?: string;
  created_at: string;
  updated_at: string;
}

export interface AIAgentVectorData {
  id: string;
  client_id: string;
  agent_name: string;
  content: string;
  metadata: {
    source?: string;
    type?: string;
    timestamp?: string;
    url?: string;
    [key: string]: any;
  };
  embedding: number[];
  created_at: string;
  updated_at: string;
}

// Combined type for all possible ai_agents table rows
export type AIAgentRow = AIAgentBase | AIAgentVectorData;

export interface Client {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  ai_agents: AIAgent[];
}

export interface AIAgent {
  id: string;
  agent_name: string;
  client_id: string;
}

export interface ActivityLog {
  id: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'chat' | 'knowledge_update';
  entity_type: 'client' | 'ai_agent' | 'chat' | 'knowledge_base';
  entity_id: string;
  user_id?: string;
  client_id?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
}

export type Database = GeneratedDatabase & {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'ai_agents'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'ai_agents'>>;
      };
      ai_agents: {
        Row: AIAgent;
        Insert: Omit<AIAgent, 'id'>;
        Update: Partial<Omit<AIAgent, 'id'>>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExtendedActivityType = 
  | 'login'
  | 'logout'
  | 'update_profile'
  | 'update_settings'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'send_invitation'
  | 'access_resource'
  | 'update_resource'; 