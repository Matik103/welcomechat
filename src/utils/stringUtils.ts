
/**
 * Utility functions for string manipulation
 */

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str String to truncate
 * @param length Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, length: number): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Formats a date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Converts camelCase to Title Case with spaces
 * @param str String in camelCase
 * @returns Title Case string
 */
export const camelToTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Sanitizes a string for SQL use
 * @param str String to sanitize
 * @returns Sanitized string
 */
export const sanitizeForSQL = (str: string): string => {
  if (!str) return '';
  return str.replace(/['"\\;]/g, '');
};
