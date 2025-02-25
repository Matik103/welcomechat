
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
      user_roles: {
        Row: {
          id: string
          created_at: string | null
          user_id: string
          role: 'admin' | 'manager' | 'user'
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id: string
          role: 'admin' | 'manager' | 'user'
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string
          role?: 'admin' | 'manager' | 'user'
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
      user_role: 'admin' | 'manager' | 'user'
    }
  }
}
