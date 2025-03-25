
// Define the structure for client form data
export interface ClientFormData {
  client_name: string;
  email: string;
  company?: string;
  bot_settings?: {
    bot_name?: string;
    bot_personality?: string;
  };
  logo_url?: string;
  status?: 'active' | 'inactive' | 'deleted';
}

// Define structure for client account info
export interface ClientAccountInfo {
  id: string;
  client_name: string;
  email: string;
  company?: string;
  created_at: string;
  status: string;
  agent_name?: string;
  agent_description?: string;
  settings?: Record<string, any>;
}

// Define structure for client update response
export interface ClientUpdateResponse {
  success: boolean;
  message: string;
  clientId?: string;
  clientData?: any;
}
