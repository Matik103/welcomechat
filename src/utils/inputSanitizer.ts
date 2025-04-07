
/**
 * Sanitizes user input to prevent SQL injection and other issues
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export const sanitizeForSQL = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // First escape single quotes by doubling them (SQL standard)
  let sanitized = input.replace(/'/g, "''");
  
  // Remove any double quotes entirely to prevent SQL syntax errors
  sanitized = sanitized.replace(/"/g, "");
  
  // Also replace any potential SQL injection patterns
  sanitized = sanitized.replace(/--/g, ""); // SQL comments
  sanitized = sanitized.replace(/;/g, ""); // SQL command terminator
  
  if (sanitized !== input) {
    console.log(`Sanitized input from "${input}" to "${sanitized}"`);
  }
  
  return sanitized;
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export const sanitizeForXSS = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Remove HTML and script tags
  let sanitized = input.replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  // Replace data: with data-safe:
  sanitized = sanitized.replace(/data:/gi, 'data-safe:');
  
  if (sanitized !== input) {
    console.log(`XSS sanitized input`);
  }
  
  return sanitized;
};

/**
 * Sanitizes object properties recursively
 * @param obj The object to sanitize
 * @returns A new sanitized object
 */
export const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  // Handle objects
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize the key
    const sanitizedKey = sanitizeForXSS(key);
    
    // Sanitize the value based on its type
    if (typeof value === 'string') {
      result[sanitizedKey] = sanitizeForXSS(value);
    } else if (typeof value === 'object' && value !== null) {
      result[sanitizedKey] = sanitizeObject(value);
    } else {
      result[sanitizedKey] = value;
    }
  }
  
  return result;
};

/**
 * Safely parse JSON with protection against prototype pollution
 * @param jsonString The JSON string to parse
 * @returns The parsed object or null if invalid
 */
export const safeJSONParse = (jsonString: string): any => {
  try {
    const parsed = JSON.parse(jsonString);
    // Protect against prototype pollution
    if (typeof parsed === 'object' && parsed !== null) {
      delete parsed.__proto__;
      delete parsed.constructor;
      delete parsed.prototype;
    }
    return sanitizeObject(parsed);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
};
