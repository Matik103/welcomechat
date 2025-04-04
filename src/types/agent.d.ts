
export interface Agent {
  id: string;
  client_id: string;
  client_name: string; // Making this required to match agentService.ts Agent interface
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
  // Adding fields that exist in agentService.ts Agent interface
  total_interactions?: number;
  average_response_time?: number;
  last_active?: string;
}
