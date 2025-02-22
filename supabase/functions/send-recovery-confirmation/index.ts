
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { clientName, email } = await req.json();

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "AI Chatbot Admin <onboarding@resend.dev>",
      to: email,
      subject: "Your Client Account Has Been Recovered",
      html: `
        <h1>Client Account Recovered Successfully</h1>
        <p>Hello,</p>
        <p>Your client account "${clientName}" has been successfully recovered and is now active again.</p>
        <p>You can access your account through the Client Management page.</p>
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
