
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
