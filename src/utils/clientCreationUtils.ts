
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { generateTempPassword } from "./passwordUtils";
import { createActivityDirect } from "@/services/clientActivityService";

/**
 * Generate a temporary password for a client
 * @param clientId Client ID
 * @param email Client email
 * @returns Generated temporary password
 */
export const generateClientTempPassword = async (clientId: string, email: string): Promise<string> => {
  try {
    console.log(`Generating temporary password for client ${clientId}`);
    
    // Generate a secure password
    const tempPassword = generateTempPassword();
    
    // Store in database
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId, // Use agent_id instead of client_id
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error generating client temp password:", error);
      throw error;
    }
    
    console.log("Generated temporary password successfully");
    return tempPassword;
  } catch (error) {
    console.error("Error in generateClientTempPassword:", error);
    throw error;
  }
};

/**
 * Save temporary password for a client
 * @param clientId Client ID
 * @param email Client email
 * @param tempPassword Temporary password
 */
export const saveClientTempPassword = async (
  clientId: string, 
  email: string, 
  tempPassword: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_temp_passwords')
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error saving client temp password:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
};

/**
 * Generate a welcome email template for the client
 * @param clientName Client name
 * @param email Client email
 * @param tempPassword Temporary password
 * @returns HTML template for the welcome email
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

/**
 * Log client creation activity
 * @param clientId Client ID
 * @param clientName Client name
 * @param email Client email
 */
export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string,
  email: string
): Promise<void> => {
  try {
    await createActivityDirect(
      clientId,
      "client_created",
      `Client ${clientName} (${email}) was created`,
      {
        client_name: clientName,
        email: email,
        created_at: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error("Error logging client creation:", error);
    // Non-blocking, so we just log the error
  }
};
