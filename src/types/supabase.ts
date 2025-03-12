export interface Client {
  id: string;
  created_at: string;
  user_id: string;
  client_name: string;
  email: string;
  company: string;
  description: string | null;
  agent_name: string | null;
  status: 'active' | 'inactive' | 'deleted';
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  website_url: string | null;
  website_url_added_at: string | null;
  drive_link: string | null;
  drive_link_added_at: string | null;
  widget_settings: any;
  urls: string[];
  drive_urls: string[];
  website_url_refresh_rate: number | null;
  website_url_last_checked: string | null;
  website_url_next_check: string | null;
  drive_link_refresh_rate: number | null;
  drive_link_last_checked: string | null;
  drive_link_next_check: string | null;
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