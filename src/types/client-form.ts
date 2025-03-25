
import * as z from 'zod';

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
  client_id?: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _tempLogoFile?: File | null;
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

// Type for form validation errors
export interface ClientFormErrors {
  [key: string]: string;
}

// Form validation schema
export const clientFormSchema = z.object({
  client_name: z.string().min(2, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  client_id: z.string().optional(),
  widget_settings: z.object({
    agent_name: z.string().min(1, 'Agent name is required'),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional(),
  _tempLogoFile: z.any().optional()
});
