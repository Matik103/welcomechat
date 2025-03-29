
import { Resend } from 'resend';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

// Make sure we have an API key, with a fallback for development
const apiKey = import.meta.env.VITE_RESEND_API_KEY || '';

// Check if API key exists
if (!apiKey) {
  console.warn('⚠️ VITE_RESEND_API_KEY is not defined in your environment variables. Email sending will fail.');
}

// Initialize Resend with the API key only if we have one
const resend = apiKey ? new Resend(apiKey) : null;

export const sendWelcomeEmail = async (to: string, clientName: string, password: string) => {
  try {
    if (!resend) {
      console.error('Cannot send email: Missing Resend API key');
      return { emailSent: false, emailError: 'Missing Resend API key' };
    }

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [to],
      subject: 'Welcome to Acme!',
      html: `<p>Hello ${clientName},</p><p>Welcome to Acme! Your password is: <strong>${password}</strong></p>`,
    });
    
    // Log activity for email sent
    await createClientActivity(
      "", // We don't have the agent ID here, it will be filled in the CreateClientForm
      clientName,
      ActivityType.EMAIL_SENT,
      `Welcome email sent to ${to}`,
      {
        email_type: "welcome",
        recipient: to,
        client_name: clientName
      }
    );
    
    return { emailSent: true, emailError: null };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { emailSent: false, emailError: String(error) };
  }
};
