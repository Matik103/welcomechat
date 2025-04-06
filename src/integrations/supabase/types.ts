export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          agent_description: string | null
          status: 'active' | 'inactive'
          logo_url: string | null
          total_interactions: number
          average_response_time: number
          last_active: string | null
          client_id: string
          agent_type: string
          agent_config: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          agent_description?: string | null
          status?: 'active' | 'inactive'
          logo_url?: string | null
          total_interactions?: number
          average_response_time?: number
          last_active?: string | null
          client_id: string
          agent_type: string
          agent_config?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          agent_description?: string | null
          status?: 'active' | 'inactive'
          logo_url?: string | null
          total_interactions?: number
          average_response_time?: number
          last_active?: string | null
          client_id?: string
          agent_type?: string
          agent_config?: Json | null
        }
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          agent_name: string
          status: 'active' | 'inactive'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          agent_name: string
          status?: 'active' | 'inactive'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          agent_name?: string
          status?: 'active' | 'inactive'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
