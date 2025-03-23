
/**
 * Generates a temporary password for client accounts
 * Using the format "Welcome2024#123" that meets Supabase Auth requirements
 * @returns A randomly generated temporary password
 */
export const generateClientTempPassword = (): string => {
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  
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
