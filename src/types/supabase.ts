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
      document_processing_logs: {
        Row: {
          id: number
          document_id: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          document_id: string
          status: 'pending' | 'processing' | 'completed' | 'error'
          metadata: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          document_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'error'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      document_content: {
        Row: {
          id: number
          document_id: string
          client_id: string
          content: string
          filename: string
          file_type: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          document_id: string
          client_id: string
          content: string
          filename: string
          file_type: string
          metadata: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          document_id?: string
          client_id?: string
          content?: string
          filename?: string
          file_type?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 