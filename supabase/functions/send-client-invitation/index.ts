
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
    console.log(`Sending invitation to client: ${clientName} (${email})`);
    
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
    
    // Check if we have a stored temporary password for this client
    const { data: passwordData, error: passwordError } = await supabaseAdmin
      .from('client_temp_passwords')
      .select('temp_password')
      .eq('client_id', clientId)
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    let password;
    
    if (passwordError || !passwordData) {
      console.log('No stored password found, generating a new one');
      // If no stored password, generate a new one using our function
      const passwordResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-client-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ email, clientId })
        }
      );
      
      if (!passwordResponse.ok) {
        console.error('Failed to generate password');
        throw new Error('Failed to generate password');
      }
      
      const passwordResult = await passwordResponse.json();
      password = passwordResult.password;
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
    
    // Return the password in the response
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
