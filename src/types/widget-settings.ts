
export interface WidgetSettings {
  logo_url: string;
  logo_storage_path?: string;
  chat_color: string;
  background_color: string;
  text_color: string;
  secondary_color: string;
  position: 'left' | 'right';
  welcome_text: string;
  response_time_text: string;
}

export const defaultSettings: WidgetSettings = {
  logo_url: "",
  logo_storage_path: "",
  chat_color: "#854fff",
  secondary_color: "#6b3fd4",
  background_color: "#ffffff",
  text_color: "#333333",
  position: "right",
  welcome_text: "Hi 👋, how can I help?",
  response_time_text: "I typically respond right away"
};

export function isWidgetSettings(value: unknown): value is WidgetSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  return typeof settings.logo_url === 'string' &&
         (settings.logo_storage_path === undefined || typeof settings.logo_storage_path === 'string') &&
         typeof settings.chat_color === 'string' &&
         typeof settings.background_color === 'string' &&
         typeof settings.text_color === 'string' &&
         typeof settings.secondary_color === 'string' &&
         (settings.position === 'left' || settings.position === 'right') &&
         typeof settings.welcome_text === 'string' &&
         typeof settings.response_time_text === 'string';
}
