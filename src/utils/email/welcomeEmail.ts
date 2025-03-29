import { Resend } from 'resend';
import { createClientActivity } from '@/services/clientActivityService';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (to: string, clientName: string, password: string) => {
  try {
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
      'email_sent',
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
