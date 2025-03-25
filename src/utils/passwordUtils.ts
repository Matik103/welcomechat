
/**
 * Generate a temporary password with specific complexity
 * @param length Length of the password (default: 12)
 * @returns The generated password
 */
export const generateTempPassword = (length = 12): string => {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // removed I and O
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // removed l
  const numberChars = '23456789'; // removed 0 and 1
  const specialChars = '!@#$%^&*-_=+';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Ensure at least one of each type
  let password = 
    getRandomChar(uppercaseChars) + 
    getRandomChar(lowercaseChars) + 
    getRandomChar(numberChars) + 
    getRandomChar(specialChars);
  
  // Fill rest with random chars from all possible chars
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(allChars);
  }
  
  // Shuffle the password characters
  return shuffleString(password);
};

/**
 * Get a random character from a string
 * @param characters String of characters to choose from
 * @returns Random character
 */
const getRandomChar = (characters: string): string => {
  return characters.charAt(Math.floor(Math.random() * characters.length));
};

/**
 * Shuffle the characters in a string
 * @param str String to shuffle
 * @returns Shuffled string
 */
const shuffleString = (str: string): string => {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // swap elements
  }
  return array.join('');
};

/**
 * Generate a secure password
 * @param length Password length (default: 12)
 * @returns The generated password
 */
export const generatePassword = (length = 12): string => {
  return generateTempPassword(length);
};

/**
 * Check if a password meets complexity requirements
 * @param password The password to check
 * @returns Whether the password is strong enough
 */
export const isStrongPassword = (password: string): boolean => {
  // Minimum length check
  if (password.length < 8) return false;
  
  // Check for uppercase, lowercase, number, and special char
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};
