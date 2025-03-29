
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

export const sendWelcomeEmail = async (to: string, clientName: string, password: string) => {
  try {
    // Call the Supabase edge function for sending emails
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: to,
        subject: 'Welcome to Acme!',
        html: `<p>Hello ${clientName},</p><p>Welcome to Acme! Your password is: <strong>${password}</strong></p>`,
        from: 'Welcome.Chat <admin@welcome.chat>'
      },
    });
    
    if (error) {
      console.error("Error invoking send-email function:", error);
      return { emailSent: false, emailError: String(error) };
    }
    
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
    
    console.log("Welcome email sent successfully:", data);
    return { emailSent: true, emailError: null };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { emailSent: false, emailError: String(error) };
  }
};
