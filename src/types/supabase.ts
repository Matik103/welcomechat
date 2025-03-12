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
  client_name: string;
  email: string;
  website_url?: string;
  website_url_added_at?: string;
  created_at: string;
  updated_at: string;
  ai_agent?: AIAgentBase;
  ai_agent_id?: string;
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
        Row: AIAgentRow;
        Insert: Partial<AIAgentBase> | Partial<AIAgentVectorData>;
        Update: Partial<AIAgentBase> | Partial<AIAgentVectorData>;
      };
      // ... other tables
    };
  };
}; 