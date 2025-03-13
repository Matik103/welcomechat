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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
      console.error("Missing required environment variables");
      throw new Error("Server configuration error: Missing required credentials");
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Generate a unique token for the invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration
    
    // Store the invitation in the database
    const { error: inviteError } = await supabase
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

    // Send invitation email using Resend
    const resend = new Resend(resendApiKey);
    const invitationLink = `${origin}/client/setup?token=${token}`;
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Welcome.Chat <onboarding@welcome.chat>",
        to: email,
        subject: "Welcome to Welcome.Chat - Complete Your Account Setup",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to Welcome.Chat!</h2>
            
            <p style="color: #333; line-height: 1.6;">Hello${clientName ? ` ${clientName}` : ''},</p>
            
            <p style="color: #333; line-height: 1.6;">You've been invited to set up your client account on Welcome.Chat. To get started:</p>
            
            <ol style="color: #333; line-height: 1.6;">
              <li>Click the button below to set up your account</li>
              <li>Create your password</li>
              <li>You'll be automatically signed in to your dashboard</li>
            </ol>
            
            <div style="margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Set Up Your Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This invitation link will expire in 24 hours. If you need a new invitation, please contact your administrator.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 0;">Best regards,<br>The Welcome.Chat Team</p>
            </div>
          </div>
        `
      });

      if (emailError) {
        console.error("Failed to send email via Resend:", emailError);
        throw emailError;
      }

      console.log("Invitation email sent successfully:", emailData);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Invitation email sent successfully",
          data: { token }
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Error sending invitation email:", error);
      
      // Clean up the invitation record if email failed
      await supabase
        .from('client_invitations')
        .delete()
        .eq('token', token);
      
      throw error;
    }
  } catch (error) {
    console.error("Error in send-client-invitation function:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
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