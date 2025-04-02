
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: string;
  created_at: string;
  description?: string;
  details?: Record<string, any>;
  user_id?: string;
}
