
export interface WidgetSettings {
  agent_name: string;
  agent_description?: string;
  welcome_text?: string;
  response_time_text?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  border_radius?: string;
  logo_url?: string;
  logo_storage_path?: string;
  position?: 'right' | 'left';
  placement?: 'bottom' | 'center' | 'top';
  theme?: 'light' | 'dark' | 'system';
  initial_messages?: string[];
  [key: string]: any;
}

export const defaultSettings: WidgetSettings = {
  agent_name: 'AI Assistant',
  agent_description: '',
  welcome_text: 'Hi 👋, how can I help?',
  response_time_text: 'I typically respond right away',
  primary_color: '#7c3aed',
  secondary_color: '#6d28d9',
  accent_color: '#4c1d95',
  background_color: '#ffffff',
  text_color: '#000000',
  font_family: 'Inter, system-ui, sans-serif',
  border_radius: '12px',
  position: 'right',
  placement: 'bottom',
  theme: 'light',
  logo_url: '',
  logo_storage_path: '',
  initial_messages: []
};
