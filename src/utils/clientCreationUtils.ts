
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a temporary password for client accounts
 * @returns A randomly generated temporary password
 */
export const generateTempPassword = (): string => {
  // Generate a password with random uppercase, lowercase, numbers and special chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  
  // Generate first part - Welcome + year
  const currentYear = new Date().getFullYear();
  
  // Generate second part - 3 random digits
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  
  // Combine for a password like "Welcome2024#123"
  password = `Welcome${currentYear}#${randomDigits}`;
  
  return password;
};

/**
 * Saves a temporary password for a client in the database
 */
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword: string
): Promise<void> => {
  const { error } = await supabase
    .from("client_temp_passwords")
    .insert({
      agent_id: agentId,
      email: email,
      temp_password: tempPassword
    });
    
  if (error) {
    console.error("Error saving client temporary password:", error);
    throw new Error("Failed to save client credentials");
  }
};
