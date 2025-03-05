
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    
    console.log("Initializing Resend client");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    const { clientId, email, clientName }: InvitationRequest = await req.json();
    
    if (!clientId || !email) {
      throw new Error("Missing required parameters: clientId and email are required");
    }
    
    console.log(`Sending invitation to client: ${clientName || 'Unknown'} (${email})`);
    
    // Generate the dashboard URL - where clients will access their dashboard
    const origin = req.headers.get("origin") || "https://welcome.chat";
    const dashboardUrl = `${origin}/client/view`;
    
    console.log(`Dashboard URL: ${dashboardUrl}`);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Try to send Supabase built-in invitation
    let supabaseInviteSuccessful = false;
    try {
      console.log("Attempting to send Supabase built-in invitation");
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          client_id: clientId,
          client_name: clientName
        },
        redirectTo: `${origin}/client/setup?id=${clientId}`
      });
      
      if (inviteError) {
        console.error("Supabase invitation failed:", inviteError.message);
      } else {
        console.log("Supabase invitation sent successfully:", inviteData);
        supabaseInviteSuccessful = true;
      }
    } catch (supabaseInviteError) {
      console.error("Exception during Supabase invitation:", supabaseInviteError);
      // Continue with custom invitation as fallback
    }
    
    // Check if we have a stored temporary password for this client
    let password;
    
    try {
      const { data: passwordData, error: passwordError } = await supabaseAdmin
        .from('client_temp_passwords')
        .select('temp_password')
        .eq('client_id', clientId)
        .eq('email', email)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (passwordError) {
        console.log('No stored password found or error retrieving it:', passwordError.message);
        // Generate a new password directly if needed
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        password = `Welcome${randomDigits}!`;
        
        // Store this password
        await supabaseAdmin
          .from('client_temp_passwords')
          .upsert({
            client_id: clientId,
            email: email,
            temp_password: password,
            created_at: new Date().toISOString(),
            used: false
          });
      } else {
        password = passwordData.temp_password;
        
        // Mark the password as used
        await supabaseAdmin
          .from('client_temp_passwords')
          .update({ used: true })
          .eq('client_id', clientId)
          .eq('email', email)
          .eq('temp_password', password);
      }
    } catch (passwordRetrievalError) {
      console.error('Error in password retrieval/generation process:', passwordRetrievalError);
      // Fallback password generation
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      password = `Welcome${randomDigits}!`;
    }
    
    console.log('Password retrieved or generated successfully');
    
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
    try {
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
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully",
        password: password,
        supabaseInviteSuccessful
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-client-invitation function:", error);
    
    // Always return 200 status to avoid frontend throwing non-2xx errors
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        success: false
      }), 
      {
        status: 200, // Changed from 500 to 200 to avoid non-2xx error
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
