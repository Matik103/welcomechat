
import { ClientActivity } from './activity';
import { z } from 'zod';
import { Json } from '@/integrations/supabase/types';

// Define the client form schema for validation
export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  description: z.string().optional(), 
  client_id: z.string().optional(),
  _tempLogoFile: z.any().optional().nullable(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional()
});

// Define the client form data type
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Define the client form errors type for validation errors
export interface ClientFormErrors {
  [key: string]: string;
}

// Define the widget settings type
export interface WidgetSettings {
  agent_name: string;
  agent_description: string;
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  button_color?: string; // Make this optional to match actual usage
  font_color: string;
  chat_font_color: string;
  background_opacity: number;
  button_text: string;
  position: "left" | "right";
  greeting_message: string;
  text_color: string;
  secondary_color: string;
  welcome_text: string;
  response_time_text: string;
  display_mode: string;
}

// Update the type to be a string instead of an enum
export type ActivityType = string;
