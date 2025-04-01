
import { Session, User } from "@supabase/supabase-js";

export type UserRole = 'admin' | 'client' | null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthData {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
}

export interface ChatInteraction {
  id: string;
  query_text: string;
  response_text?: string;
  response?: string;
  created_at: string;
  agent_name: string;
  client_id: string;
  response_time_ms?: number;
}

export interface Agent {
  id: string;
  name: string;
  client_id: string;
  client_name?: string | null;
  agent_description?: string | null;
  status?: string | null;
  last_active?: string | null;
  response_time_ms?: number | null;
  logo_url?: string | null;
  logo_storage_path?: string | null;
  total_interactions?: number;
  average_response_time?: number;
}

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  last_asked?: string;
  created_at?: string;
}
