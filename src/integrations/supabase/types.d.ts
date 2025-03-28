
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'client';

export interface Database {
  public: {
    Tables: {
      ai_agents: {
        Row: {
          ai_prompt: string | null
          agent_description: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          error_message: string | null
          error_status: string | null
          error_type: string | null
          id: string
          interaction_type: string | null
          is_error: boolean | null
          logo_storage_path: string | null
          logo_url: string | null
          name: string | null
          openai_assistant_id: string | null
          query_text: string | null
          response_time_ms: number | null
          sentiment: string | null
          settings: Json | null
          size: number | null
          status: string | null
          topic: string | null
          type: string | null
          updated_at: string | null
          uploadDate: string | null
          url: string | null
          webhook_url: string | null
          client_name: string | null
          email: string | null
          company: string | null
          deleted_at: string | null
          deletion_scheduled_at: string | null
          widget_settings: Json | null
          last_active: string | null
        }
        Insert: {
          ai_prompt?: string | null
          agent_description?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          error_message?: string | null
          error_status?: string | null
          error_type?: string | null
          id?: string
          interaction_type?: string | null
          is_error?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string | null
          openai_assistant_id?: string | null
          query_text?: string | null
          response_time_ms?: number | null
          sentiment?: string | null
          settings?: Json | null
          size?: number | null
          status?: string | null
          topic?: string | null
          type?: string | null
          updated_at?: string | null
          uploadDate?: string | null
          url?: string | null
          webhook_url?: string | null
          client_name?: string | null
          email?: string | null
          company?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          widget_settings?: Json | null
          last_active?: string | null
        }
        Update: {
          ai_prompt?: string | null
          agent_description?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          error_message?: string | null
          error_status?: string | null
          error_type?: string | null
          id?: string
          interaction_type?: string | null
          is_error?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string | null
          openai_assistant_id?: string | null
          query_text?: string | null
          response_time_ms?: number | null
          sentiment?: string | null
          settings?: Json | null
          size?: number | null
          status?: string | null
          topic?: string | null
          type?: string | null
          updated_at?: string | null
          uploadDate?: string | null
          url?: string | null
          webhook_url?: string | null
          client_name?: string | null
          email?: string | null
          company?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          widget_settings?: Json | null
          last_active?: string | null
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
      document_processing: {
        Row: {
          id: number
          document_url: string
          client_id: string
          agent_name: string
          document_type: string
          status: string
          started_at: string
          completed_at?: string
          error?: string
          metadata: Json
          chunks: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          document_url: string
          client_id: string
          agent_name: string
          document_type: string
          status: string
          started_at: string
          completed_at?: string
          error?: string
          metadata?: Json
          chunks?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          document_url?: string
          client_id?: string
          agent_name?: string
          document_type?: string
          status?: string
          started_at?: string
          completed_at?: string
          error?: string
          metadata?: Json
          chunks?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
      update_client_with_settings: {
        Args: {
          p_client_id: string
          p_client_name: string
          p_email: string
          p_agent_name: string
          p_agent_description?: string
          p_logo_url?: string
          p_logo_storage_path?: string
          p_settings?: Json
        }
        Returns: boolean
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
