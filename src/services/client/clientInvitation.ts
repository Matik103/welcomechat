
import { generateTempPassword } from './passwordUtils';

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
    
    // Get the session token
    const sessionResponse = await supabase.auth.getSession();
    const accessToken = sessionResponse.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error("No auth session found - please log in again");
    }
    
    // Call the edge function using the proper URL construction
    const createUserResponse = await fetch(`${window.location.origin}/api/create-client-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        email: email,
        password: tempPassword,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName
      })
    });
    
    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      throw new Error(`Failed to create user account: ${errorData.error || createUserResponse.statusText}`);
    }
    
    console.log("Created auth user for client successfully");
    
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
    // Use fetch for send-email function to avoid CORS issues
    const emailResponse = await fetch(`${window.location.origin}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        from: "Welcome.Chat <admin@welcome.chat>"  // Using admin@welcome.chat
      })
    });
    
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send invitation email: ${errorData.error || emailResponse.statusText}`);
    }
    
    const emailResponseJson = await emailResponse.json();
    console.log("Invitation email response:", emailResponseJson);
    
    return;
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};

// Import supabase at the top
import { supabase } from "@/integrations/supabase/client";
