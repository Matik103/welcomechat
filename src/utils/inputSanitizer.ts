
/**
 * Utility functions for sanitizing user input to prevent SQL injection and syntax errors
 */

/**
 * Sanitizes strings that will be used in SQL queries
 * Replaces double quotes with single quotes to prevent SQL syntax errors
 * @param value String to sanitize
 * @returns Sanitized string
 */
export const sanitizeForSQL = (value: string | undefined): string | undefined => {
  if (!value) return value;
  
  // Always replace double quotes with single quotes to prevent SQL syntax errors
  let sanitized = value.replace(/"/g, "'");
  
  // Also escape any other potential SQL injection characters
  sanitized = sanitized.replace(/\\/g, "\\\\"); // escape backslashes
  
  return sanitized;
};

/**
 * Checks if a string contains any double quotes
 * @param value String to check
 * @returns True if the string contains double quotes
 */
export const containsDoubleQuotes = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.includes('"');
};

/**
 * Sanitizes user input in real-time by replacing double quotes with single quotes
 * @param event Change event from input or textarea
 */
export const sanitizeInputOnChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue?: (value: string) => void
): void => {
  // Replace double quotes with single quotes
  const sanitizedValue = event.target.value.replace(/"/g, "'");
  
  // Update the input value
  if (sanitizedValue !== event.target.value) {
    event.target.value = sanitizedValue;
    
    // If a setValue function is provided, call it with the sanitized value
    if (setValue) {
      setValue(sanitizedValue);
    }
  }
};
