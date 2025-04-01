
/**
 * Generates a random password with specified length
 * @param length The length of the password to generate (default: 12)
 * @returns A random password string
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  
  // Ensure we have at least one of each: uppercase, lowercase, number, special char
  password += "A";  // uppercase
  password += "a";  // lowercase
  password += "1";  // number
  password += "!";  // special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password characters
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
