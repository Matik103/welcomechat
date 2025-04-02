
/**
 * Safely parses JSON settings, returning an empty object if parsing fails
 * This is useful for handling widget_settings or other JSON fields
 */
export const safeParseSettings = (settings: any): Record<string, any> => {
  if (!settings) {
    return {};
  }
  
  if (typeof settings === 'object') {
    return settings;
  }
  
  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings);
    } catch (e) {
      console.error('Failed to parse settings string:', e);
      return {};
    }
  }
  
  return {};
};

/**
 * Extract a value from settings with type safety
 */
export const getSettingValue = <T>(
  settings: Record<string, any> | null | undefined,
  key: string,
  defaultValue: T
): T => {
  if (!settings) {
    return defaultValue;
  }
  
  const value = settings[key];
  return value !== undefined ? value as T : defaultValue;
};
