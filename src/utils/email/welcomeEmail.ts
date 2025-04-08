
import { supabase } from '@/integrations/supabase/client';

interface EmailResult {
  emailSent: boolean;
  emailError?: string;
}

export const sendWelcomeEmail = async (
  email: string,
  clientName: string,
  password: string
): Promise<EmailResult> => {
  try {
    console.log(`Sending welcome email to ${email} for client ${clientName}`);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `Welcome to Welcome.Chat - Your Client Account`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h1 style="color: #4a6cf7;">Welcome to Welcome.Chat</h1>
            <p>Hello ${clientName},</p>
            <p>Your client account has been created successfully. Here are your login details:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p>Please login at <a href="https://welcome.chat/login" style="color: #4a6cf7;">welcome.chat/login</a> and change your password after your first login.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The Welcome.Chat Team</p>
          </div>
        `,
        from: 'Welcome.Chat <admin@welcome.chat>'
      }
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return {
        emailSent: false,
        emailError: error.message || "Unknown error occurred while sending email"
      };
    }

    return {
      emailSent: true
    };
  } catch (error) {
    console.error("Unexpected error in sendWelcomeEmail:", error);
    return {
      emailSent: false,
      emailError: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
