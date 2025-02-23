
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { clientId, clientName, email } = await req.json();

    if (!clientId || !clientName || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create recovery token
    const token = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create recovery token in database
    const { error: tokenError } = await supabase
      .from("client_recovery_tokens")
      .insert({
        client_id: clientId,
        token: token,
        expires_at: expiryDate.toISOString(),
      });

    if (tokenError) {
      console.error("Error creating recovery token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to create recovery token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const recoveryUrl = `${origin}/recover?token=${token}`;

    const { error: emailError } = await resend.emails.send({
      from: "AI Chatbot Admin <onboarding@resend.dev>",
      to: [email],
      subject: "Your Account Deletion Request",
      html: `
        <h1>Account Deletion Notice</h1>
        <p>Dear ${clientName},</p>
        <p>Your account has been scheduled for deletion in 30 days.</p>
        <p>If you wish to recover your account, you can do so by clicking the link below:</p>
        <p><a href="${recoveryUrl}">Recover My Account</a></p>
        <p>This recovery link will expire in 30 days.</p>
        <p>If you don't want to recover your account, no action is needed. Your account will be permanently deleted after 30 days.</p>
        <p>Best regards,<br>AI Chatbot Admin Team</p>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send deletion email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Deletion email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-deletion-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
