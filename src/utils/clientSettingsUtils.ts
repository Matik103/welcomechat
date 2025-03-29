
import { Json } from "@/integrations/supabase/types";

export function safeParseSettings(settings: string | number | boolean | { [key: string]: Json | undefined; } | Json[] | null): Record<string, any> {
  if (!settings) {
    return {};
  }
  
  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings);
    } catch (e) {
      return {};
    }
  }
  
  if (typeof settings === 'object' && !Array.isArray(settings)) {
    return settings as Record<string, any>;
  }
  
  return {};
}

export function getSettingsProp<T>(
  settings: string | number | boolean | { [key: string]: Json | undefined; } | Json[] | null, 
  prop: string, 
  defaultValue: T
): T {
  const parsed = safeParseSettings(settings);
  return parsed[prop] !== undefined ? parsed[prop] : defaultValue;
}
