
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
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
    
    // Initialize Resend for email sending
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }
    
    const resend = new Resend(resendApiKey);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials are not properly configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let body: InvitationRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { clientId, email, clientName } = body;
    
    if (!clientId || !email || !clientName) {
      throw new Error("Missing required parameters");
    }
    
    console.log(`Processing invitation for client: ${clientName}, email: ${email}`);
    
    // Check if there's an existing pending invitation
    const { data: existingInvitation, error: checkError } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("client_id", clientId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing invitation:", checkError);
    }

    let token;
    let invitationUrl;
    let expiresAt;

    if (existingInvitation) {
      // Use existing invitation if it hasn't expired
      const currentTime = new Date();
      const expirationTime = new Date(existingInvitation.expires_at);
      
      if (expirationTime > currentTime) {
        console.log("Using existing invitation that hasn't expired yet");
        token = existingInvitation.token;
        expiresAt = existingInvitation.expires_at;
      } else {
        // Generate a new token if the existing one is expired
        token = crypto.randomUUID();
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update the existing invitation
        const { error: updateError } = await supabase
          .from("client_invitations")
          .update({
            token: token,
            status: "pending",
            expires_at: expiresAt.toISOString()
          })
          .eq("id", existingInvitation.id);

        if (updateError) {
          console.error("Error updating invitation:", updateError);
          throw new Error("Failed to update invitation record");
        }
      }
    } else {
      // Generate a secure random token
      token = crypto.randomUUID();
      
      // Set expiration date (24 hours from now)
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Save the invitation in the database
      const { error: insertError } = await supabase
        .from("client_invitations")
        .insert({
          client_id: clientId,
          email: email,
          token: token,
          status: "pending",
          expires_at: expiresAt.toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting invitation:", insertError);
        throw new Error("Failed to create invitation record");
      }
    }
    
    // Generate the invitation URL with the token
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";
    invitationUrl = `${baseUrl}/client/setup?token=${token}`;
    
    console.log("Generated invitation URL:", invitationUrl);
    
    // Send the invitation email with Welcome.Chat sender
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Welcome.Chat <admin@welcome.chat>",
        to: email,
        subject: `${clientName} AI Assistant - Account Setup`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h1>Welcome to ${clientName} AI Assistant!</h1>
              <p>You've been invited to set up your AI Assistant dashboard.</p>
              <p>Please click the link below to create your account:</p>
              <p>
                <a href="${invitationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Up Your Account</a>
              </p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't request this invitation, please ignore this email.</p>
              <p>Best regards,<br>Welcome.Chat Team</p>
            </body>
          </html>
        `
      });
      
      if (emailError) {
        console.error("Error sending email:", emailError);
        throw new Error(`Failed to send invitation email: ${emailError.message}`);
      }
      
      console.log("Email sent successfully:", emailData);
    } catch (emailError: any) {
      console.error("Exception sending email:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully" 
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
