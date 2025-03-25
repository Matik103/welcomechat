
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";

/**
 * Generates a temporary password for a client
 * @returns A secure random password
 */
export const generateTempPassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

/**
 * Saves a temporary password for a client
 * @param agentId Agent ID
 * @param email Client email
 * @param tempPassword Temporary password
 * @returns The result of the operation
 */
export const saveClientTempPassword = async (agentId: string, email: string, tempPassword: string): Promise<any> => {
  try {
    console.log(`Saving temporary password for agent ${agentId} with email ${email}`);
    
    // Insert into client_temp_passwords table
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: agentId,
        email: email,
        temp_password: tempPassword
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error saving client temp password:", error);
      throw new Error(error.message);
    }
    
    console.log("Temporary password saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw new Error(`Failed to save temporary password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates a welcome email template for a client
 * @param clientName Client name
 * @param email Client email
 * @param tempPassword Temporary password
 * @returns The email HTML
 */
export const generateClientWelcomeEmailTemplate = (
  clientName: string,
  email: string,
  tempPassword: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
      </div>
      
      <p>Hello ${clientName || 'Client'},</p>
      
      <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email Address:</strong></p>
        <p style="color: #4f46e5;">${email || ''}</p>
        
        <p><strong>Temporary Password:</strong></p>
        <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword || ''}</p>
      </div>
      
      <p>To get started:</p>
      <ol>
        <li>Click the "Sign In" button below</li>
        <li>Enter your email and temporary password exactly as shown above</li>
        <li>You'll be taken to your client dashboard</li>
        <li>Configure your AI assistant's settings</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://welcomeai.io/client/auth" 
           style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Sign In
        </a>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
        <p><strong>Security Notice:</strong></p>
        <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
      </div>
      
      <p>Best regards,<br>The Welcome.Chat Team</p>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
      </div>
    </div>
  `;
};
