
/**
 * Truncates a string to the specified length and adds an ellipsis
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if necessary
 */
export const truncateString = (str: string, length: number): string => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Formats a date string to a more readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Slugifies a string (converts spaces to hyphens, lowercases, removes special chars)
 * @param str - String to slugify
 * @returns Slugified string
 */
export const slugify = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
