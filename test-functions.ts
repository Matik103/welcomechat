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
  password: string;
  loginUrl?: string;
}

async function sendWelcomeEmail({ to, password, loginUrl = 'https://app.welcome.chat/login' }: SendEmailParams) {
  console.log(`Sending welcome email to ${to}...`);

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: 'Welcome to Welcome.Chat! Here are your login credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Welcome to Welcome.Chat!</h1>
            <p>We're excited to have you on board. Here are your login credentials:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p>For security reasons, please change your password after your first login.</p>
            <p>You can access your dashboard here: <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a></p>
            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            <p style="margin-top: 30px;">Best regards,<br>The Welcome.Chat Team</p>
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
    password: process.env.TEST_PASSWORD || 'test-password-123',
    loginUrl: process.env.LOGIN_URL
  });
}

export { sendWelcomeEmail }; 