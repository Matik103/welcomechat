
import { sendEmail } from './emailSender';
import { generateClientInvitationTemplate } from './emailTemplates';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';

/**
 * Sends a welcome email to a newly created client with their login credentials
 * @param email The client's email address
 * @param clientName The client's name
 * @param tempPassword The temporary password assigned to the client
 * @returns Object indicating if the email was sent successfully
 */
export const sendWelcomeEmail = async (
  email: string, 
  clientName: string, 
  tempPassword: string
): Promise<{ emailSent: boolean; emailError?: string }> => {
  console.log("Sending welcome email to:", email);
  
  if (!email || !email.includes('@')) {
    console.error("Invalid email address provided:", email);
    return {
      emailSent: false,
      emailError: "Invalid email address"
    };
  }
  
  try {
    // Verify the client exists in Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (userError) {
      console.log("User not found in Supabase Auth, creating user");
      
      // Create the user in Supabase Auth if they don't exist
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: clientName,
          role: 'client'
        }
      });
      
      if (createError) {
        console.error("Failed to create Supabase Auth user:", createError);
        return {
          emailSent: false,
          emailError: `Failed to create auth user: ${createError.message}`
        };
      }
      
      console.log("Created Supabase Auth user successfully:", createdUser.user.id);
    } else {
      console.log("User found in Supabase Auth:", userData.user.id);
    }
    
    // Generate the HTML template
    const html = generateClientInvitationTemplate({
      clientName,
      email,
      tempPassword,
      productName: "Welcome.Chat"
    });
    
    // Send the email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Welcome.Chat - Your Account Details',
      html: html,
      from: 'Welcome.Chat <admin@welcome.chat>'
    });
    
    if (!emailResult.success) {
      console.error("Error sending welcome email:", emailResult.error);
      return {
        emailSent: false,
        emailError: emailResult.error || "Unknown error sending email"
      };
    }
    
    console.log("Welcome email sent successfully");
    return {
      emailSent: true
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Exception while sending welcome email:", error);
    return {
      emailSent: false,
      emailError: error.message
    };
  }
};
