
import { supabase } from "@/integrations/supabase/client";
import { createActivityDirect } from "@/services/clientActivityService";

/**
 * Generate a temporary password for a new client
 * @returns A secure temporary password
 */
export const generateTempPassword = (): string => {
  const length = 12;
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
 * Save a temporary password for a client
 * @param clientId The client ID
 * @param email The client email
 * @param tempPassword The temporary password
 */
export const saveClientTempPassword = async (
  clientId: string, 
  email: string, 
  tempPassword: string
): Promise<void> => {
  try {
    // Save temporary password in the database
    const { error } = await supabase
      .from('client_temp_passwords')
      .insert({
        client_id: clientId,
        email: email,
        temp_password: tempPassword,
        created_at: new Date().toISOString(),
        used: false
      });
    
    if (error) throw error;
    
    // Log activity
    await createActivityDirect(
      clientId,
      'client_created',
      `Temporary password generated for ${email}`,
      { email }
    );
  } catch (error) {
    console.error("Error saving temporary password:", error);
    throw error;
  }
};

/**
 * Generate a welcome email template for a new client
 * @param clientName The client name
 * @param email The client email
 * @param tempPassword The temporary password
 * @returns HTML email template
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
 * @param clientId The client ID
 * @param clientName The client name
 * @param email The client email
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string
): Promise<void> => {
  try {
    await createActivityDirect(
      clientId,
      'client_created',
      `Client ${clientName} created with email ${email}`,
      { client_name: clientName, email }
    );
  } catch (error) {
    console.error("Error logging client creation activity:", error);
    // Non-blocking - don't throw
  }
};
