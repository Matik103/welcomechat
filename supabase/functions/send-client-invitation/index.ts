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
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    // Store the invitation in the database
    const { error: inviteError } = await supabaseAdmin
      .from('client_invitations')
      .insert({
        client_id: clientId,
        token: token,
        email: email,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
      throw new Error("Failed to create invitation record");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Send invitation email using Resend
    const setupUrl = `${origin}/client/setup?token=${token}`;
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Welcome.Chat - Your Account Invitation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Welcome.Chat!</h2>
          
          <p>Hello${clientName ? ` ${clientName}` : ''},</p>
          
          <p>You have been invited to create your Welcome.Chat account. To get started:</p>
          
          <ol style="line-height: 1.6;">
            <li>Click the button below to set up your account</li>
            <li>Create your password</li>
            <li>You'll be automatically signed in to your dashboard</li>
          </ol>
          
          <div style="margin: 30px 0;">
            <a href="${setupUrl}" style="
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
            ">Set Up Your Account</a>
          </div>
          
          <p style="color: #666;">This invitation link will expire in 24 hours.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <p>Best regards,<br>The Welcome.Chat Team</p>
        </div>
      `
    });

    if (emailError) {
      console.error("Error sending email with Resend:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully with Resend:", emailData);
    
    // Return success response
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
    
    // Return error response
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