
export interface Agent {
  id: string;
  client_id: string;
  client_name: string; // Added this required property
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  interaction_type: string;
  settings?: any;
  openai_assistant_id?: string;
  logo_url?: string;
  logo_storage_path?: string;
  agent_description?: string;
}
