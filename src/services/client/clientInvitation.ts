
import { generateTempPassword } from './passwordUtils';
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the auth token is valid before making requests
 */
async function ensureValidToken() {
  try {
    // Check the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      throw error;
    }
    
    if (!session) {
      console.error("No session found");
      throw new Error("Authentication required");
    }
    
    // If session is about to expire (within 5 minutes), refresh it
    const expiresAt = session.expires_at;
    const isExpiringSoon = expiresAt && (expiresAt * 1000 - Date.now() < 300000); // 5 minutes
    
    if (isExpiringSoon) {
      console.log("Token expiring soon, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        throw refreshError;
      }
      
      console.log("Token refreshed successfully");
    }
    
    return session.access_token;
  } catch (err) {
    console.error("Token validation failed:", err);
    throw new Error("Authentication failed, please sign in again");
  }
}

/**
 * Sends an invitation email to a new client
 */
export const sendClientInvitationEmail = async (params: { 
  clientId: string, 
  clientName: string, 
  email: string,
  agentName: string
}): Promise<void> => {
  const { clientId, clientName, email, agentName } = params;
  
  // Generate a secure temporary password
  const tempPassword = generateTempPassword();
  
  try {
    console.log("Creating client auth user account...");
    
    // Ensure we have a valid token before proceeding
    const accessToken = await ensureValidToken();
    
    if (!accessToken) {
      throw new Error("No auth session found - please log in again");
    }
    
    // Fix: Use Supabase function invoke method instead of direct fetch
    // This ensures proper URL construction and authentication
    console.log("Invoking create-client-user function");
    const { data: userData, error: userError } = await supabase.functions.invoke('create-client-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        email: email,
        password: tempPassword,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName
      }
    });
    
    // Check if the response is valid
    if (userError) {
      console.error("Error creating user account:", userError);
      throw new Error(`Failed to create user account: ${userError.message || userError}`);
    }
    
    console.log("Created auth user for client successfully:", userData);
    
    // Then send the welcome email
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
    
    // Re-fetch the token to ensure it's still valid (or get a newly refreshed one)
    const emailToken = await ensureValidToken();
    
    // Fix: Also use Supabase invoke for send-email function
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailToken}`
      },
      body: {
        to: email,
        subject: emailSubject,
        html: emailHtml,
        from: "Welcome.Chat <admin@welcome.chat>"
      }
    });
    
    // Handle email response
    if (emailError) {
      console.error("Email sending failed:", emailError);
      throw new Error(`Failed to send invitation email: ${emailError.message || emailError}`);
    }
    
    console.log("Invitation email sent successfully:", emailData);
    return;
    
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};
