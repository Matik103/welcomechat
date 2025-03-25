
/**
 * Generate a secure random password
 * @param length Password length (default: 12)
 * @returns A secure random password
 */
export const generateTempPassword = (length = 12): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Generate random password
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};

// Alias for backward compatibility
export const generateClientTempPassword = generateTempPassword;

/**
 * Check if a password meets minimum security requirements
 * @param password The password to check
 * @returns Whether the password is secure
 */
export const isSecurePassword = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) return false;
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

/**
 * Generate a password reset token
 * @returns A secure random token
 */
export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
