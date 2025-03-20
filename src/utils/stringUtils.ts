
/**
 * Converts an agent name to a valid class name by removing special characters 
 * and spaces, and making it lowercase
 */
export const agentNameToClassName = (agentName: string): string => {
  if (!agentName) return '';
  
  // Replace spaces with underscores, remove special characters, and convert to lowercase
  return agentName
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')
    .toLowerCase();
};

/**
 * Safely converts a value to a JSON string
 */
export const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return '{}';
  }
};

/**
 * Safely parses a JSON string to an object
 */
export const safeParse = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Failed to parse JSON string:', error);
    return {};
  }
};
