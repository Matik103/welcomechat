
export interface Client {
  id: string;
  client_id?: string;
  client_name: string;
  agent_name?: string;
  email?: string;
  company?: string;
  description?: string;
  status?: string;
  country?: string;
  state?: string;
  city?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  created_at?: string;
  updated_at?: string;
  client_role?: string;
  logo_url?: string;
  logo_storage_path?: string;
  onboarding_status?: string;
  onboarding_completed_at?: string;
  last_login?: string;
  last_active?: string;
  account_owner?: string;
  payment_status?: string;
  subscription_tier?: string;
  subscription_start_date?: string;
  subscription_renewal_date?: string;
  billing_email?: string;
  custom_domain?: string;
  sso_enabled?: boolean;
  two_factor_enabled?: boolean;
  active?: boolean;
  deleted_at?: string | null;
  widget_settings?: any;
  openai_assistant_id?: string;
  deepseek_assistant_id?: string;
  assistant_id?: string;
  api_key?: string;
  website_url?: string;
  website_url_last_updated?: string;
  website_url_update_frequency?: number;
  website_url_refresh_rate?: number;
}

export interface ClientDetailsResponse {
  id: string;
  client_name: string;
  email: string;
  company: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  logo_url?: string;
  widget_settings: {
    agent_name: string;
    agent_description: string;
    theme_color: string;
    [key: string]: any;
  };
}

export interface ClientListResponse {
  clients: Client[];
  count: number;
}

export interface ClientCreatedResponse {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  created_at: string;
}

export interface ClientUpdateResponse {
  id: string;
  client_name: string;
  updated_at: string;
}

export interface ClientDeleteResponse {
  id: string;
  client_name: string;
  deleted_at: string;
}
