
import { sendEmail } from './emailSender';
import { generateDeletionNotificationTemplate } from './emailTemplates';

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
    
    // Create the recovery URL
    const recoveryUrl = `${window.location.origin}/client/auth?recovery=${recoveryToken}`;
    
    // Generate the HTML template
    const html = generateDeletionNotificationTemplate({
      clientName,
      recoveryUrl,
      formattedDeletionDate
    });
    
    // Send the email
    const { data, error } = await sendEmail({
      to: email,
      subject: 'Important: Your Account is Scheduled for Deletion',
      html: html,
      from: 'Welcome.Chat <admin@welcome.chat>'
    });
    
    if (!data || error) {
      console.error("Error sending deletion notification email:", error);
      return {
        emailSent: false,
        emailError: error?.message || "Unknown error sending email"
      };
    }
    
    console.log("Deletion notification email sent successfully:", data);
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
