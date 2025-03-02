
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from = "admin@welcome.chat" } = await req.json() as EmailRequest;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email to: ${to}`);

    // Send email with Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { data, error } = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
