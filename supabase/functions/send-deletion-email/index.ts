
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, clientName, email } = await req.json();

    // Create recovery token
    const { data: tokenData, error: tokenError } = await supabase
      .from("client_recovery_tokens")
      .insert({
        client_id: clientId,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    const recoveryLink = `${Deno.env.get("PUBLIC_SITE_URL")}/recover-client?token=${tokenData.token}`;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "AI Chatbot Admin <onboarding@resend.dev>",
      to: email,
      subject: "Your Client Account Has Been Scheduled for Deletion",
      html: `
        <h1>Client Account Scheduled for Deletion</h1>
        <p>Hello,</p>
        <p>Your client account "${clientName}" has been scheduled for deletion. The account and all associated data will be permanently deleted in 30 days.</p>
        <p>If you wish to recover your account, you can do so by clicking the button below within the next 30 days:</p>
        <a href="${recoveryLink}" style="display: inline-block; background-color: #854fff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Recover Account</a>
        <p>If you don't want to recover your account, no action is needed and the account will be permanently deleted.</p>
        <p>Best regards,<br>AI Chatbot Admin Team</p>
      `,
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
