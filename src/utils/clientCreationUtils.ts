
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

/**
 * Logs the client creation activity
 */
export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string, 
  email: string, 
  agentName: string
): Promise<void> => {
  try {
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "New client created with AI agent",
      metadata: {
        client_name: clientName,
        email: email,
        agent_name: agentName
      }
    });
  } catch (activityError) {
    console.error("Error logging client creation activity:", activityError);
    // Continue even if activity logging fails
  }
};

/**
 * Generates a secure temporary password for client accounts
 * @returns A randomly generated temporary password
 */
export const generateTempPassword = (): string => {
  // Generate a password with the format "Welcome2024$123"
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  const specialChars = ['!', '@', '#', '$', '%', '&', '*'];
  const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  return `Welcome${currentYear}${randomSpecialChar}${randomDigits}`;
};

/**
 * Saves the temporary password for a client in the database
 */
export const saveClientTempPassword = async (
  clientId: string,
  email: string,
  tempPassword: string
): Promise<void> => {
  try {
    await supabase.from("client_temp_passwords").insert({
      client_id: clientId,
      email: email,
      temp_password: tempPassword,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    });
    console.log("Saved temporary password for client:", clientId);
  } catch (error) {
    console.error("Error saving temporary password:", error);
    // Continue even if saving fails
  }
};

/**
 * Generates an HTML email template for client welcome emails
 */
export const generateClientWelcomeEmailTemplate = (
  clientName: string,
  email: string,
  tempPassword?: string,
  productName: string = "Welcome.Chat"
): string => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Password instructions message based on whether we're including a temp password
  const passwordMessage = tempPassword 
    ? `
      <p style="margin: 0 0 10px 0; color: #555555;"><strong>Temporary Password:</strong></p>
      <p style="margin: 0 0 0 0; color: #4f46e5; font-family: monospace; font-size: 18px; padding: 10px; background-color: #eef1ff; border-radius: 4px;">${tempPassword}</p>
    `
    : `<p style="margin: 0 0 20px 0; color: #555555;">You will receive a separate email to set your password.</p>`;
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #4f46e5; border-radius: 8px;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0; padding: 0;">Welcome to ${productName}!</h1>
      </div>
      
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">Hello <strong>${clientName || 'Client'}</strong>,</p>
      
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">Your AI assistant account has been created and is ready for configuration. Here are your login details:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4f46e5;">
        <p style="margin: 0 0 10px 0; color: #555555;"><strong>Email Address:</strong></p>
        <p style="margin: 0 0 20px 0; color: #4f46e5; font-size: 16px;">${email || ''}</p>
        
        ${passwordMessage}
      </div>
      
      <p style="color: #333333; font-size: 16px; line-height: 1.5;">To get started:</p>
      <ol style="color: #333333; font-size: 16px; line-height: 1.8; padding-left: 20px;">
        <li>Click the "Sign In" button below</li>
        <li>${tempPassword ? 'Enter your email and temporary password' : 'Set your password using the separate password reset email'}</li>
        <li>You'll be taken to your client dashboard</li>
        <li>Configure your AI assistant's settings</li>
      </ol>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://admin.welcome.chat/client/dashboard" 
           style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
          Sign In
        </a>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
        <p style="margin: 0 0 10px 0; color: #555555;"><strong>Security Notice:</strong></p>
        <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.5;">For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
      </div>
      
      <p style="margin-top: 25px; color: #333333; font-size: 16px; line-height: 1.5;">Best regards,<br><strong>The ${productName} Team</strong></p>
      
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #9ca3af; font-size: 12px;">
        &copy; ${currentYear} ${productName}. All rights reserved.
      </div>
    </div>
  `;
};
