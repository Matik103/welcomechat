
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientId: string;
  email: string;
  clientName: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, email, clientName, from = "admin@welcome.chat" } = await req.json() as InvitationRequest;

    if (!clientId || !email || !clientName) {
      return new Response(
        JSON.stringify({ error: "clientId, email and clientName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing invitation for client ${clientId}, email: ${email}`);

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Generate token
    const token = crypto.randomUUID();

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from("client_invitations")
      .insert({
        client_id: clientId,
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: "pending"
      })
      .select("*")
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the public site URL
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || req.headers.get("origin") || "";
    const setupUrl = `${siteUrl}/client/setup?token=${token}`;

    console.log(`Invitation created, setup URL: ${setupUrl}`);

    // Send email with Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #4338ca;">Welcome to Your AI Assistant!</h1>
            <p>Hello,</p>
            <p>You have been invited to set up your account for <strong>${clientName}</strong>.</p>
            <p>Please click the button below to complete your account setup:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" style="background-color: #4338ca; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Set Up Your Account</a>
            </div>
            <p>This link will expire in 7 days.</p>
            <p>If you did not expect this invitation, please ignore this email.</p>
            <p>Best regards,<br>AI Assistant Team</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: from,
        to: email,
        subject: `${clientName} - Your AI Assistant Account Invitation`,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send invitation email", details: emailError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({ success: true, message: "Invitation sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Exception sending email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
