
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
  | 'website_added' 
  | 'website_removed' 
  | 'website_processed' 
  | 'document_link_added' 
  | 'document_link_removed' 
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
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _tempLogoFile?: File | null;
}
