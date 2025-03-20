
/**
 * Sanitizes user input to prevent SQL injection and other issues
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export const sanitizeForSQL = (input: string | null | undefined): string => {
  if (input === null || input === undefined) {
    return '';
  }
  
  // Replace all double quotes with single quotes to avoid SQL syntax errors
  let sanitized = input.replace(/"/g, "'");
  
  // Also replace any potential SQL injection patterns
  sanitized = sanitized.replace(/--/g, ""); // SQL comments
  sanitized = sanitized.replace(/;/g, ""); // SQL command terminator
  
  // Log the sanitization for debugging
  console.log(`Sanitized input from "${input}" to "${sanitized}"`);
  
  return sanitized;
};
