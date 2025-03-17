
/**
 * Generates a secure random password
 */
export const generateTempPassword = (): string => {
  // Create a consistent but secure password format
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  // Start with a consistent prefix for easier testing
  let password = 'Welcome';
  
  // Add random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Ensure it has at least one special character
  password += '!';
  
  return password;
};
