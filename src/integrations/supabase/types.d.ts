
export interface Json {
  [key: string]: any;
}

export interface Database {
  public: {
    Tables: {
      ai_agents: {
        Row: {
          id: string;
          client_id: string;
          client_name?: string;
          name?: string;
          description?: string;
          ai_prompt?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
          content?: string;
          interaction_type?: string;
          settings?: Json;
          query_text?: string;
          response_time_ms?: number;
          error_type?: string;
          error_message?: string;
          error_status?: string;
          user_id?: string;
          is_deleted?: boolean;
          deletion_scheduled_at?: string;
          notified_at?: string;
          email?: string;
          company?: string;
          assistant_id?: string;
          agent_description?: string;
          logo_url?: string;
          logo_storage_path?: string;
          openai_assistant_id?: string;
          deepseek_assistant_id?: string;
          last_active?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          client_name: string;
          status: string;
          created_at: string;
          user_id?: string;
          email?: string;
          company?: string;
          description?: string;
          updated_at?: string;
          deleted_at?: string;
          deletion_scheduled_at?: string;
          is_deleted?: boolean;
          is_error?: boolean;
          logo_url?: string;
          logo_storage_path?: string;
          last_active?: string;
          openai_assistant_id?: string;
          deepseek_assistant_id?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          client_id?: string;
          type: string;
          description: string;
          created_at: string;
          metadata?: Json;
          user_id?: string;
        };
      };
    };
  };
}
