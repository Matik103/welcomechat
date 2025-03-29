
import { sendEmail, EmailOptions } from './emailSender';
import { generateClientInvitationTemplate } from './emailTemplates';

/**
 * Sends a welcome email to the client with their credentials
 */
export const sendWelcomeEmail = async (email: string, clientName: string, tempPassword: string) => {
  console.log("Sending welcome email to:", email);
  console.log("Using password:", tempPassword ? `${tempPassword.substring(0, 3)}...` : "No password provided");
  
  if (!email || !email.includes('@')) {
    console.error("Invalid email address provided:", email);
    return {
      emailSent: false,
      emailError: "Invalid email address"
    };
  }
  
  if (!tempPassword) {
    console.error("No temporary password provided");
    return {
      emailSent: false,
      emailError: "No temporary password provided"
    };
  }
  
  try {
    // Generate the HTML template
    const html = generateClientInvitationTemplate({
      clientName: clientName || "Client",
      email: email,
      tempPassword: tempPassword,
      productName: "Welcome.Chat"
    });
    
    // Create email options
    const emailOptions: EmailOptions = {
      to: email,
      subject: "Welcome to Welcome.Chat - Your Account Details",
      html: html,
      from: "Welcome.Chat <admin@welcome.chat>"
    };
    
    const emailResult = await sendEmail(emailOptions);
    
    console.log("Welcome email result:", emailResult);
    
    if (!emailResult.success) {
      console.error("Error sending welcome email:", emailResult.error);
      console.error("Error details:", emailResult.details);
      return {
        emailSent: false,
        emailError: emailResult.error
      };
    }
    
    console.log("Welcome email sent successfully");
    return {
      emailSent: true
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Exception while sending welcome email:", error);
    return {
      emailSent: false,
      emailError: errorMsg
    };
  }
};
