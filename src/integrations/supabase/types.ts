export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          agent_description: string | null
          chunk_index: number | null
          chunk_metadata: Json | null
          client_id: string | null
          client_name: string | null
          content: string | null
          created_at: string | null
          email: string | null
          embedding: string | null
          error_message: string | null
          error_status: string | null
          error_type: string | null
          id: string
          interaction_type: string | null
          is_error: boolean | null
          logo_storage_path: string | null
          logo_url: string | null
          name: string
          openai_assistant_id: string | null
          query_text: string | null
          response_time_ms: number | null
          sentiment: string | null
          settings: Json | null
          topic: string | null
          total_chunks: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          agent_description?: string | null
          chunk_index?: number | null
          chunk_metadata?: Json | null
          client_id?: string | null
          client_name?: string | null
          content?: string | null
          created_at?: string | null
          email?: string | null
          embedding?: string | null
          error_message?: string | null
          error_status?: string | null
          error_type?: string | null
          id?: string
          interaction_type?: string | null
          is_error?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name: string
          openai_assistant_id?: string | null
          query_text?: string | null
          response_time_ms?: number | null
          sentiment?: string | null
          settings?: Json | null
          topic?: string | null
          total_chunks?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          agent_description?: string | null
          chunk_index?: number | null
          chunk_metadata?: Json | null
          client_id?: string | null
          client_name?: string | null
          content?: string | null
          created_at?: string | null
          email?: string | null
          embedding?: string | null
          error_message?: string | null
          error_status?: string | null
          error_type?: string | null
          id?: string
          interaction_type?: string | null
          is_error?: boolean | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string
          openai_assistant_id?: string | null
          query_text?: string | null
          response_time_ms?: number | null
          sentiment?: string | null
          settings?: Json | null
          topic?: string | null
          total_chunks?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activities: {
        Row: {
          activity_type: string
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_recovery_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_recovery_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_temp_passwords: {
        Row: {
          agent_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          temp_password: string
          used_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          temp_password: string
          used_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          temp_password?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agent_name: string | null
          client_name: string
          created_at: string | null
          email: string
          id: string
          status: string | null
          updated_at: string | null
          widget_settings: Json | null
        }
        Insert: {
          agent_name?: string | null
          client_name: string
          created_at?: string | null
          email: string
          id?: string
          status?: string | null
          updated_at?: string | null
          widget_settings?: Json | null
        }
        Update: {
          agent_name?: string | null
          client_name?: string
          created_at?: string | null
          email?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          widget_settings?: Json | null
        }
        Relationships: []
      }
      document_processing: {
        Row: {
          agent_name: string
          chunks: Json
          client_id: string
          completed_at: string | null
          created_at: string
          document_type: string
          document_url: string
          error: string | null
          id: number
          metadata: Json
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          chunks?: Json
          client_id: string
          completed_at?: string | null
          created_at?: string
          document_type: string
          document_url: string
          error?: string | null
          id?: number
          metadata?: Json
          started_at: string
          status: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          chunks?: Json
          client_id?: string
          completed_at?: string | null
          created_at?: string
          document_type?: string
          document_url?: string
          error?: string | null
          id?: number
          metadata?: Json
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_processing_jobs: {
        Row: {
          agent_name: string | null
          client_id: string | null
          created_at: string | null
          document_id: string | null
          document_type: string
          document_url: string
          error: string | null
          id: string
          metadata: Json | null
          processing_method: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_name?: string | null
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type: string
          document_url: string
          error?: string | null
          id?: string
          metadata?: Json | null
          processing_method: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_name?: string | null
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          document_type?: string
          document_url?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          processing_method?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_status: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          message: string | null
          metadata: Json | null
          progress: number | null
          stage: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          progress?: number | null
          stage?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          metadata?: Json | null
          progress?: number | null
          stage?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_status_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "document_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      update_ai_agents_from_client_settings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_processing_status: {
        Args: {
          p_job_id: string
          p_status: string
          p_progress: number
          p_stage: string
          p_message?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      activity_type_enum:
        | "document_uploaded"
        | "document_processing_started"
        | "document_processing_completed"
        | "document_processing_failed"
        | "openai_assistant_document_added"
        | "openai_assistant_upload_failed"
        | "client_created"
        | "client_updated"
        | "client_deleted"
        | "client_recovered"
        | "system_update"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

