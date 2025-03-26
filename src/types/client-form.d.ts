
import { UserRole } from "./auth";

export interface ClientForm {
  id?: string;
  client_name?: string;
  company?: string;
  description?: string;
  email?: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  }
  _tempLogoFile?: any;
}

export type ActivityType = 
  | 'client_created' 
  | 'client_updated' 
  | 'client_deleted' 
  | 'config_updated' 
  | 'website_url_added'
  | 'website_url_deleted'
  | 'website_url_processed'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_processed' 
  | 'document_added'
  | 'agent_error'
  | 'login_success'
  | 'login_failed'
  | 'password_reset'
  | 'user_invited'
  | 'invitation_accepted';

export interface ClientFormData {
  client_id?: string;
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _tempLogoFile?: File | null;
}

export interface ClientFormErrors {
  [key: string]: string;
}

// Define the client form schema for validation
export const clientFormSchema = {
  client_id: String,
  client_name: String,
  email: String,
  company: String,
  description: String,
  widget_settings: {
    agent_name: String,
    agent_description: String,
    logo_url: String,
    logo_storage_path: String
  },
  _tempLogoFile: File
};

export interface WidgetSettings {
  agent_name?: string;
  agent_description?: string;
  logo_url?: string;
  logo_storage_path?: string;
  client_name?: string;
  email?: string;
  client_id?: string;
  [key: string]: any;
}
