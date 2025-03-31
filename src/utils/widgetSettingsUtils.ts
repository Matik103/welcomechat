
/**
 * Extract widget settings from various possible sources
 * @param data The data object that may contain widget settings
 * @returns The extracted widget settings as an object
 */
export const extractWidgetSettings = (data: any): Record<string, any> => {
  // Handle possible locations for widget settings
  if (!data) return {};
  
  // First try if settings is a property
  if (data.settings) {
    // Could be an object or a JSON string
    if (typeof data.settings === 'object' && !Array.isArray(data.settings)) {
      return data.settings;
    }
    
    if (typeof data.settings === 'string') {
      try {
        const parsed = JSON.parse(data.settings);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error('Error parsing settings JSON:', error);
      }
    }
  }
  
  // Next try widget_settings
  if (data.widget_settings) {
    if (typeof data.widget_settings === 'object' && !Array.isArray(data.widget_settings)) {
      return data.widget_settings;
    }
    
    if (typeof data.widget_settings === 'string') {
      try {
        const parsed = JSON.parse(data.widget_settings);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error('Error parsing widget_settings JSON:', error);
      }
    }
  }
  
  // Directly use the data object properties to construct widget settings
  const constructedSettings: Record<string, any> = {};
  
  // Copy relevant properties if they exist
  if (data.agent_name || data.name) constructedSettings.agent_name = data.agent_name || data.name;
  if (data.agent_description) constructedSettings.agent_description = data.agent_description;
  if (data.logo_url) constructedSettings.logo_url = data.logo_url;
  if (data.logo_storage_path) constructedSettings.logo_storage_path = data.logo_storage_path;
  
  // Return the settings we were able to extract
  return constructedSettings;
};
