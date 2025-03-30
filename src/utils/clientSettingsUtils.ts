
/**
 * Safely parse client settings from various formats to ensure we have a valid object
 * @param settings The settings to parse, which could be a string, object, or null
 * @returns A valid object containing the settings
 */
export const safeParseSettings = (settings: any): Record<string, any> => {
  if (!settings) {
    return {};
  }

  // If settings is already an object, return it
  if (typeof settings === 'object' && !Array.isArray(settings)) {
    return settings;
  }

  // If settings is a string, try to parse it as JSON
  if (typeof settings === 'string') {
    try {
      const parsed = JSON.parse(settings);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('Error parsing settings JSON:', error);
    }
  }

  // If we've reached here, settings is not in a valid format
  console.warn('Settings is not in a valid format, returning empty object');
  return {};
};
