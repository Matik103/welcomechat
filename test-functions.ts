import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SendEmailParams {
  to: string;
  clientName: string;
  tempPassword: string;
}

async function sendWelcomeEmail({ to, clientName, tempPassword }: SendEmailParams) {
  console.log(`Sending welcome email to ${to}...`);

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: 'Welcome to Welcome.Chat - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
            </div>
            
            <p>Hello ${clientName},</p>
            
            <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email Address:</strong></p>
              <p style="color: #4f46e5;">${to}</p>
              
              <p><strong>Temporary Password:</strong></p>
              <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${tempPassword}</p>
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
              <p>For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
            </div>
          </div>
        `
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      if (error.context) {
        const response = error.context;
        console.error('Response details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        try {
          const errorBody = await response.text();
          console.error('Error body:', errorBody);
        } catch (e) {
          console.error('Could not read error body:', e);
        }
      }
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

// Example usage:
if (process.env.NODE_ENV === 'development') {
  sendWelcomeEmail({
    to: process.env.TEST_EMAIL || 'test@example.com',
    clientName: 'Test Client',
    tempPassword: process.env.TEST_PASSWORD || 'test-password-123'
  });
}

export { sendWelcomeEmail }; 