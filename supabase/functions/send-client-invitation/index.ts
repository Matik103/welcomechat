
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid request format");
    }
    
    const { clientId, email, clientName } = requestBody as InvitationRequest;
    
    if (!clientId || !email) {
      console.error("Missing required parameters:", { clientId, email });
      throw new Error("Missing required parameters: clientId and email are required");
    }
    
    console.log(`Sending invitation to client: ${clientName || 'Unknown'} (${email}), ID: ${clientId}`);
    
    // Generate the dashboard URL - use client setup URL with the client ID
    const origin = req.headers.get("origin") || "https://admin.welcome.chat";
    const setupUrl = `${origin}/client/setup?id=${clientId}`;
    
    console.log("Setup URL for client:", setupUrl);
    
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
    
    if (!supabaseAdmin) {
      console.error("Failed to initialize Supabase admin client");
      throw new Error("Failed to initialize Supabase client");
    }
    
    // Custom email template options - direct to setup page instead of auth flow
    const emailOptions = {
      data: {
        client_id: clientId,
        client_name: clientName,
        setup_url: setupUrl
      },
      // This is critical: redirect directly to setup page with client ID
      redirectTo: setupUrl,
      // Custom email template content for Supabase's invitation email
      email_template: {
        subject: "Welcome to Welcome.Chat - Your Account Invitation",
        content: `
<h2>You have been invited to Welcome.Chat</h2>

<p>Hello${clientName ? ` ${clientName}` : ''},</p>

<p>You have been invited to create an account on Welcome.Chat. Follow this link to set up your account:</p>

<p><a href="${setupUrl}">Set Up Your Account</a></p>

<p><strong>Important next steps:</strong></p>
<ol>
  <li>Click the link above to go to your setup page</li>
  <li>You'll be asked to create a password for your account</li>
  <li>After setting your password, you'll be automatically signed in to your dashboard</li>
</ol>

<p>Thank you,<br>The Welcome.Chat Team</p>
        `
      }
    };
    
    // Send Supabase built-in invitation
    console.log("Sending Supabase built-in invitation");
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, emailOptions);
    
    if (inviteError) {
      console.error("Supabase invitation failed:", inviteError.message);
      throw inviteError;
    }
    
    console.log("Supabase invitation sent successfully:", inviteData);
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully"
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
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
