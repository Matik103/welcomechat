export interface AIAgent {
  id: string;
  name: string;
  personality: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  client_name: string;
  email: string;
  website_url?: string;
  website_url_added_at?: string;
  created_at: string;
  updated_at: string;
  ai_agent?: AIAgent;
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Partial<Client>;
        Update: Partial<Client>;
      };
      // ... other tables
    };
  };
}; 