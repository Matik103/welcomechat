
import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction } from "@/utils/rpcUtils";
import { ActivityType } from "@/types/activity";
import { createActivityDirect } from "@/services/clientActivityService";

/**
 * Generates a secure random password
 * @param length The length of the password
 * @returns A random password
 */
export const generateRandomPassword = (length: number = 10): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

/**
 * Generates a temporary password for a client user
 * @returns A temporary password that meets security requirements
 */
export const generateTempPassword = (): string => {
  // Generate a password with at least:
  // - 12 characters
  // - 1 uppercase letter
  // - 1 lowercase letter
  // - 1 number
  // - 1 special character
  const length = 12;
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  // Start with one of each required character type
  let password = "";
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Fill the rest with random characters from all sets
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Alias for generateTempPassword for backward compatibility
 * @returns A temporary password
 */
export const generateClientTempPassword = generateTempPassword;

/**
 * Resets a client's password to a new temporary password
 * @param clientId The client ID
 * @param email The client's email
 * @returns An object with the result of the operation
 */
export const resetClientPassword = async (
  clientId: string,
  email: string
): Promise<{
  success: boolean;
  message: string;
  tempPassword?: string;
}> => {
  try {
    // Generate a temporary password
    const tempPassword = generateTempPassword();
    
    // Store the temporary password in client_temp_passwords
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error storing temporary password:", error);
      return {
        success: false,
        message: `Failed to store temporary password: ${error.message}`
      };
    }
    
    // Log the password reset activity
    await createActivityDirect(
      clientId,
      'password_reset' as ActivityType,
      `Password reset for ${email}`,
      { email }
    );
    
    return {
      success: true,
      message: "Password reset successfully",
      tempPassword
    };
  } catch (error) {
    console.error("Error in resetClientPassword:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Saves a temporary password for a client
 * @param clientId The client ID
 * @param email The client's email
 * @param tempPassword The temporary password
 * @returns The result of the operation
 */
export const saveClientTempPassword = async (
  clientId: string,
  email: string,
  tempPassword: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Store the temporary password in client_temp_passwords
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error storing temporary password:", error);
      return {
        success: false,
        message: `Failed to store temporary password: ${error.message}`
      };
    }
    
    // Log the activity
    await createActivityDirect(
      clientId,
      'client_created' as ActivityType,
      `Temporary password created for ${email}`,
      { email }
    );
    
    return {
      success: true,
      message: "Temporary password saved successfully"
    };
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
