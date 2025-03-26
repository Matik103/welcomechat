
export interface WidgetSettings {
  agent_name: string;
  agent_description: string;
  logo_url: string;
  logo_storage_path: string;
  theme_color: string;
  font: string;
  button_position: string;
  welcome_message: string;
  initial_messages: string[];
  placeholder_text: string;
  button_icon: string;
  chat_icon: string;
  show_sources: boolean;
  powered_by_text: string;
  reset_conversation: boolean;
  custom_css: string;
}

export const defaultSettings: WidgetSettings = {
  agent_name: 'AI Assistant',
  agent_description: 'I can help answer your questions',
  logo_url: '',
  logo_storage_path: '',
  theme_color: '#3B82F6',
  font: 'Inter',
  button_position: 'bottom-right',
  welcome_message: 'Hello! How can I help you today?',
  initial_messages: [],
  placeholder_text: 'Ask me anything...',
  button_icon: 'message-circle',
  chat_icon: 'bot',
  show_sources: true,
  powered_by_text: '',
  reset_conversation: true,
  custom_css: ''
};
