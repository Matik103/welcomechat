export interface Client {
  id: string;
  created_at: string;
  user_id: string;
  client_name: string;
  company: string;
  description: string | null;
  status: 'active' | 'inactive' | 'deleted';
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  drive_link: string | null;
  drive_link_added_at: string | null;
  widget_settings: any;
  urls: string[];
  drive_urls: string[];
  email: string;
  agent_name?: string; // Make agent_name optional to match database schema
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
  
  // Document properties
  size?: number;
  type?: string;
  uploadDate?: string;
  status?: string;
}

export type ActivityType = string;

export interface ClientActivity {
  id: string;
  client_id: string;
  type: ActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      ai_agents: {
        Row: AIAgent;
        Insert: Partial<AIAgent>;
        Update: Partial<AIAgent>;
      };
      client_activities: {
        Row: {
          type: string;
          client_id: string | null;
          created_at: string;
          description: string | null;
          id: number;
          metadata: Json | null;
        }
        Insert: {
          type: string;
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: number;
          metadata?: Json | null;
        }
        Update: {
          type?: string;
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: number;
          metadata?: Json | null;
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          agent_name: string | null
          client_name: string | null
          company: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_scheduled_at: string | null
          email: string | null
          id: string
          last_active: string | null
          logo_storage_path: string | null
          logo_url: string | null
          status: string | null
          updated_at: string | null
          widget_settings: Json | null
        }
        Insert: {
          agent_name?: string | null
          client_name?: string | null
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          email?: string | null
          id?: string
          last_active?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          status?: string | null
          updated_at?: string | null
          widget_settings?: Json | null
        }
        Update: {
          agent_name?: string | null
          client_name?: string | null
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          email?: string | null
          id?: string
          last_active?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          status?: string | null
          updated_at?: string | null
          widget_settings?: Json | null
        }
        Relationships: []
      }
      document_links: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"] | null
          client_id: string | null
          created_at: string
          document_type: string | null
          id: number
          link: string | null
          notified_at: string | null
          refresh_rate: number | null
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"] | null
          client_id?: string | null
          created_at?: string
          document_type?: string | null
          id?: number
          link?: string | null
          notified_at?: string | null
          refresh_rate?: number | null
        }
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"] | null
          client_id?: string | null
          created_at?: string
          document_type?: string | null
          id?: number
          link?: string | null
          notified_at?: string | null
          refresh_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_links_client_id_fkey"
            columns: ["client_id"]
            isOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          role: string | null
          user_id: string
        }
        Insert: {
          role?: string | null
          user_id: string
        }
        Update: {
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_urls: {
        Row: {
          client_id: string | null
          created_at: string
          id: number
          last_crawled: string | null
          refresh_rate: number | null
          status: string | null
          url: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: number
          last_crawled?: string | null
          refresh_rate?: number | null
          status?: string | null
          url?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: number
          last_crawled?: string | null
          refresh_rate?: number | null
          status?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_urls_client_id_fkey"
            columns: ["client_id"]
            isOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_new_client: {
        Args: {
          p_client_name: string
          p_email: string
          p_agent_name?: string
          p_logo_url?: string
          p_logo_storage_path?: string
          p_widget_settings?: Json
          p_status?: string
        }
        Returns: string
      }
      get_agent_dashboard_stats: {
        Args: {
          client_id_param: string
          agent_name_param: string
        }
        Returns: Json
      }
      get_client_dashboard_stats: {
        Args: {
          client_id_param: string
        }
        Returns: Json
      }
      get_client_agent_names: {
        Args: {
          client_id_param: string
        }
        Returns: {
          agent_name: string
        }[]
      }
      get_common_queries: {
        Args: {
          client_id_param: string
          agent_name_param: string
          limit_param: number
        }
        Returns: {
          query_text: string
          frequency: number
        }[]
      }
      get_document_access_status: {
        Args: {
          document_id: number
        }
        Returns: Database["public"]["Enums"]["access_status"]
      }
      log_chat_interaction: {
        Args: {
          client_id_param: string
          agent_name_param: string
          query_text_param: string
          response_text_param: string
          response_time_ms_param?: number
          topic_param?: string
          sentiment_param?: string
          metadata_param?: Json
        }
        Returns: string
      }
      match_agent_client: {
        Args: {
          client_id_param: string
          limit_param?: number
        }
        Returns: {
          id: string
          agent_name: string
          client_id: string
          client_name: string
          content: string
          query_text: string
          response_time_ms: number
          is_error: boolean
          error_type: string
          error_message: string
          created_at: string
          settings: Json
        }[]
      }
      sanitize_agent_input: {
        Args: {
          input_text: string
        }
        Returns: string
      }
    }
    Enums: {
      access_status: "granted" | "pending" | "denied"
      activity_type_enum:
        | "client_created"
        | "client_updated"
        | "client_deleted"
        | "client_recovered"
        | "widget_settings_updated"
        | "website_url_added"
        | "website_url_deleted"
        | "drive_link_added"
        | "drive_link_deleted"
        | "document_uploaded"
        | "document_processed"
        | "document_processing_failed"
        | "chat_interaction"
        | "agent_name_updated"
        | "agent_logo_updated"
        | "agent_description_updated"
        | "ai_agent_created"
        | "ai_agent_updated"
        | "error_logged"
        | "webhook_sent"
        | "system_update"
        | "common_query_milestone"
        | "interaction_milestone"
        | "growth_milestone"
        | "invitation_sent"
        | "invitation_accepted"
        | "user_role_updated"
        | "login_success"
        | "login_failed"
        | "logo_uploaded"
        | "ai_agent_table_created"
        | "document_processing_started"
        | "document_processing_completed"
        | "source_added"
        | "source_deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types for JSON
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
