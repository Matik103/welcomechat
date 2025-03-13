import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

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
    
    // Get the origin from request headers or use default
    const origin = req.headers.get("origin") || "https://welcome.chat";
    console.log("Using origin:", origin);
    
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      throw new Error("Server configuration error: Missing Supabase credentials");
    }
    
    console.log("Initializing Supabase admin client with URL:", supabaseUrl);
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate a unique token for the invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    // Store the invitation in the database
    const { error: inviteError } = await supabaseAdmin
      .from('client_invitations')
      .insert({
        client_id: clientId,
        email: email,
        token: token,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
      console.error("Failed to create invitation record:", inviteError);
      throw inviteError;
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("Missing RESEND_API_KEY environment variable");
      throw new Error("Server configuration error: Missing Resend API key");
    }

    // Send invitation email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "WelcomeChat <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to WelcomeChat - Your Account Invitation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to WelcomeChat!</h2>
          
          <p>Hello${clientName ? ` ${clientName}` : ''},</p>
          
          <p>You have been invited to create an account on WelcomeChat. To get started:</p>
          
          <ol style="line-height: 1.6;">
            <li>Click the button below to accept this invitation</li>
            <li>Set up your password</li>
            <li>You'll be automatically signed in to your dashboard</li>
          </ol>
          
          <div style="margin: 30px 0;">
            <a href="${origin}/client-setup?token=${token}" style="
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
            ">Accept Invitation</a>
          </div>
          
          <p>This invitation link will expire in 24 hours.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <p>Best regards,<br>The WelcomeChat Team</p>
        </div>
      `
    });

    if (emailError) {
      console.error("Failed to send email with Resend:", emailError);
      throw emailError;
    }

    console.log("Invitation email sent successfully:", emailData);
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation email sent successfully",
        data: emailData
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Return with error information
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
        details: error.stack,
        success: false
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});