
export interface Client {
  id: string;
  created_at: string;
  user_id: string;
  client_name: string;
  company: string;
  description: string | null;
  agent_name: string | null;
  status: 'active' | 'inactive' | 'deleted';
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  drive_link: string | null;
  drive_link_added_at: string | null;
  widget_settings: any;
  urls: string[];
  drive_urls: string[];
  email: string;
}

export interface AIAgent {
  id: string;
  client_id: string;
  name: string;
  agent_description?: string;
  content?: string;
  embedding?: any;
  url?: string;
  interaction_type?: string;
  query_text?: string;
  response_time_ms?: number;
  is_error?: boolean;
  error_type?: string;
  error_message?: string;
  error_status?: string;
  topic?: string;
  sentiment?: string;
  settings?: any;
  created_at?: string;
  updated_at?: string;
  logo_url?: string;
  logo_storage_path?: string;
  ai_prompt?: string;
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Partial<Client>;
        Update: Partial<Client>;
      };
      ai_agents: {
        Row: AIAgent;
        Insert: Partial<AIAgent>;
        Update: Partial<AIAgent>;
      };
      // ... other tables
    };
  };
}; 
