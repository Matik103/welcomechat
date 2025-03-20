
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
  email: string; // Add email field to match actual database schema
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
