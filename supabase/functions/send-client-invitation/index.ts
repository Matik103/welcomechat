
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
  defaultPassword?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log("Send client invitation function started");
    
    // Validate Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Resend API key not configured");
    }
    
    // Create Supabase client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log("Initializing Resend client");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    const { clientId, email, clientName, defaultPassword }: InvitationRequest = await req.json();
    console.log(`Sending invitation to client: ${clientName} (${email})`);
    
    // Generate the dashboard URL - where clients will access their dashboard
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const dashboardUrl = `${origin}/client/view`;
    
    console.log(`Dashboard URL: ${dashboardUrl}`);
    
    // Generate a default password if one wasn't provided
    const password = defaultPassword || `welcome${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`Generated password: ${password.substring(0, 3)}***`); // Log partially obscured password for security
    
    try {
      // First check if user exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      
      if (existingUser) {
        console.log("User exists, updating password...");
        // Update existing user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: password,
          email_confirm: true
        });
        
        if (updateError) {
          console.error("Error updating user password:", updateError);
          throw updateError;
        }
        console.log("Password updated successfully for existing user");
      } else {
        console.log("User doesn't exist, creating new user...");
        // Create new user with the generated password
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true, // Skip email confirmation
          user_metadata: {
            client_id: clientId
          }
        });
        
        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }
        console.log("New user created successfully with password");
      }
    } catch (authError) {
      console.error("Error in authentication process:", authError);
      throw authError;
    }
    
    // Updated email content with dashboard link and login credentials
    const htmlContent = `
      <h1>Welcome to Welcome.Chat, Your Agent!</h1>
      <p>Your account has been created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Click the button below to access your dashboard:</p>
      <p><a href="${dashboardUrl}" style="display: inline-block; background-color: #6366F1; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-family: Arial, sans-serif;">Access Your Dashboard</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${dashboardUrl}</p>
      <p><strong>Important:</strong> For security reasons, please change your password after logging in. You can do this in your account settings.</p>
      <p>Thank you,<br>The Welcome.Chat Team</p>
    `;
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Welcome.Chat <noreply@welcome.chat>",
      to: email,
      subject: "Welcome to Welcome.Chat - Your Login Credentials",
      html: htmlContent
    });
    
    if (error) {
      console.error("Error from Resend API:", error);
      throw error;
    }
    
    console.log("Invitation email sent successfully:", data);
    
    // Return the password in the response so it can be saved in the database if needed
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully",
        password: password
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
