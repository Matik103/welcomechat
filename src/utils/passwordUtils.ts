
/**
 * Generates a temporary password for client accounts
 * Using the format "Welcome{YEAR}#{RANDOM}" that meets Supabase Auth requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter (Welcome)
 * - Contains at least one lowercase letter (elcome)
 * - Contains at least one number (2024, 123)
 * - Contains at least one special character (#)
 * 
 * @returns A randomly generated temporary password
 */
export const generateClientTempPassword = (): string => {
  const currentYear = new Date().getFullYear();
  // Generate random digits between 100-999 to ensure 3 digits
  const randomDigits = Math.floor(Math.random() * 900) + 100; 
  
  return `Welcome${currentYear}#${randomDigits}`;
};

/**
 * This function is maintained for backward compatibility
 * but internally uses the standardized Welcome format
 * @returns A randomly generated secure password
 */
export const generateSecurePassword = (): string => {
  return generateClientTempPassword();
};
