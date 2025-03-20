
/**
 * Generates a temporary password for client accounts
 * @returns A randomly generated temporary password
 */
export const generateClientTempPassword = (): string => {
  // Characters to use in the password
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O (can be confused with 1 and 0)
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz'; // No l (can be confused with 1)
  const numberChars = '23456789'; // No 0 or 1 (can be confused with O and l)
  const specialChars = '!@#$%^&*';
  
  // Combined character set
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Generate a 10-character password
  let password = '';
  
  // Ensure at least one character from each character set
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Fill the rest of the password with random characters
  for (let i = 4; i < 10; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};
