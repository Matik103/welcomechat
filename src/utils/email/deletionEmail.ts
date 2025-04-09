
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends a deletion notification email to the client with recovery instructions
 * @param email The client's email address
 * @param clientName The client's name
 * @param recoveryToken The recovery token
 * @param deletionDate The scheduled deletion date
 * @returns Object indicating if the email was sent successfully
 */
export const sendDeletionEmail = async (
  email: string, 
  clientName: string, 
  recoveryToken: string,
  deletionDate: string
): Promise<{ emailSent: boolean; emailError?: string }> => {
  console.log("Sending deletion notification email to:", email);
  
  if (!email || !email.includes('@')) {
    console.error("Invalid email address provided:", email);
    return {
      emailSent: false,
      emailError: "Invalid email address"
    };
  }
  
  if (!recoveryToken) {
    console.error("No recovery token provided");
    return {
      emailSent: false,
      emailError: "No recovery token provided"
    };
  }
  
  try {
    // Format the deletion date for display
    const formattedDeletionDate = new Date(deletionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create the recovery URL - ensure we have the correct origin
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://welcomeai.io';
    const recoveryUrl = `${origin}/client/auth?recovery=${recoveryToken}`;
    
    // Call the Supabase Edge Function with proper error handling
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Important: Your Account is Scheduled for Deletion',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h1 style="color: #ff4a4a;">Account Scheduled for Deletion</h1>
            <p>Hello ${clientName},</p>
            <p>Your account has been scheduled for deletion. All your data will be <strong>permanently removed</strong> on ${formattedDeletionDate}.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p><strong>If this was a mistake</strong>, you can recover your account by clicking the button below:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${recoveryUrl}" 
                   style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Recover My Account
                </a>
              </div>
              <p>This recovery link will expire on ${formattedDeletionDate}.</p>
            </div>
            <p>If you intended to delete your account, no further action is required. Your data will be automatically removed after the deletion date.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The Welcome.Chat Team</p>
          </div>
        `,
        from: 'Welcome.Chat <admin@welcome.chat>'
      }
    });
    
    if (error) {
      console.error("Error sending deletion notification email:", error);
      return {
        emailSent: false,
        emailError: error.message || "Unknown error occurred while sending email"
      };
    }
    
    console.log("Deletion notification email send result:", data);
    
    return {
      emailSent: true
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Exception while sending deletion notification email:", error);
    return {
      emailSent: false,
      emailError: error.message
    };
  }
};
