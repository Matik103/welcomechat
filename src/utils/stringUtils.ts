
/**
 * Sanitizes a string by removing quotation marks and other potentially problematic characters
 * @param str The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return str.replace(/["`']/g, '');
}

/**
 * Validates if a string contains quotation marks or other problematic characters
 * @param str The string to validate
 * @returns True if the string is valid (no problematic characters), false otherwise
 */
export function isValidString(str: string | null | undefined): boolean {
  if (str === null || str === undefined) return true;
  return !/["`']/.test(str);
}

/**
 * Validates agent name to ensure it doesn't contain problematic characters
 * @param name The agent name to validate
 * @returns An object containing whether the name is valid and any error message
 */
export function validateAgentName(name: string | null | undefined): { 
  isValid: boolean; 
  errorMessage?: string;
} {
  if (!name) return { isValid: true };
  
  if (/["`']/.test(name)) {
    return { 
      isValid: false, 
      errorMessage: "Agent name cannot contain quotation marks or other special characters"
    };
  }
  
  return { isValid: true };
}
