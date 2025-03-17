
import { generateTempPassword } from './passwordUtils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an invitation email to a new client
 */
export const sendClientInvitationEmail = async (params: { 
  clientId: string, 
  clientName: string, 
  email: string,
  agentName: string
}): Promise<{ success: boolean, emailSent: boolean, error?: string }> => {
  const { clientId, clientName, email, agentName } = params;
  
  // Generate a secure temporary password
  const tempPassword = generateTempPassword();
  let userCreated = false;
  let emailSent = false;
  let errorMessage = '';
  
  try {
    console.log("Creating client auth user account...");
    console.log("Payload:", { 
      email, 
      client_id: clientId, 
      client_name: clientName, 
      agent_name: agentName 
    });
    
    // Create the user account via edge function
    const { data: createUserData, error: createUserError } = await supabase.functions.invoke('create-client-user', {
      body: {
        email: email,
        password: tempPassword,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName
      }
    });
    
    // Enhanced error handling for user creation
    if (createUserError) {
      console.error("Error creating client user:", createUserError);
      const errorMsg = typeof createUserError === 'object' ? 
        JSON.stringify(createUserError) : 
        createUserError.toString();
      errorMessage = `Failed to create user account: ${errorMsg}`;
      return { success: false, emailSent: false, error: errorMessage };
    }
    
    // Check if the response data contains an error
    if (createUserData && createUserData.error) {
      console.error("Error response from create-client-user:", createUserData.error);
      errorMessage = `Failed to create user account: ${createUserData.error}`;
      return { success: false, emailSent: false, error: errorMessage };
    }
    
    console.log("Created auth user for client successfully:", createUserData);
    userCreated = true;
    
    // Then try to send the welcome email
    console.log("Preparing to send welcome email...");
    const loginUrl = `${window.location.origin}/client/auth`;
    
    // Prepare email content with agent name
    const emailSubject = `Welcome to Welcome.Chat - ${agentName} AI Assistant Setup`;
    
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #4a5568; text-align: center;">Welcome to Welcome.Chat!</h1>
      
      <p>Hello ${clientName},</p>
      
      <p>You have been invited to create your account for Welcome.Chat. Your AI assistant "${agentName}" has been set up and is ready for you to configure.</p>
      
      <p><strong>Your temporary password is: ${tempPassword}</strong></p>
      
      <p>To complete your account setup:</p>
      
      <ol>
        <li>Click the button below to sign in</li>
        <li>Use your email (${email}) and temporary password to log in</li>
        <li>You'll be automatically redirected to your client dashboard</li>
        <li>Configure your AI assistant's settings in the dashboard</li>
      </ol>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${loginUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In</a>
      </div>
      
      <p>This invitation link will expire in 24 hours.</p>
      
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      
      <p>Best regards,<br>The Welcome.Chat Team</p>
    </div>
    `;
    
    console.log("Sending invitation email...");
    
    try {
      // Send the email via edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: emailSubject,
          html: emailHtml,
          from: "Welcome.Chat <admin@welcome.chat>"
        }
      });
      
      // Check if there was an error
      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        errorMessage = `Failed to send invitation email: ${emailError.message || JSON.stringify(emailError)}`;
        // Continue with account creation even if email fails
      }
      
      // Check if the response data contains an error
      else if (emailData && emailData.error) {
        console.error("Error response from send-email:", emailData.error);
        errorMessage = `Failed to send invitation email: ${emailData.error}`;
        // Continue with account creation even if email fails
      }
      else {
        console.log("Invitation email sent successfully:", emailData);
        emailSent = true;
      }
    } catch (emailSendError: any) {
      // Continue with account creation even if email fails, but track error
      console.error("Email sending failed:", emailSendError);
      errorMessage = `Email sending failed: ${emailSendError.message || JSON.stringify(emailSendError)}`;
    }
    
    // Even if email fails, we still created the user account
    return { 
      success: userCreated, 
      emailSent,
      error: errorMessage || undefined 
    };
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return { 
      success: userCreated, 
      emailSent,
      error: `Error during client invitation: ${error.message || JSON.stringify(error)}` 
    };
  }
};
