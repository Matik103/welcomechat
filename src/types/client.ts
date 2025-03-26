
import { Json } from '@/integrations/supabase/types';

export interface Client {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deletion_scheduled_at: string | null;
  last_active: string | null;
  logo_url: string;
  logo_storage_path: string;
  agent_name: string;
  agent_description: string;
  widget_settings: Record<string, any>;
}
