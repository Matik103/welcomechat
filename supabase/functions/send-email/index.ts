
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    const resend = new Resend(resendApiKey);
    
    const { to, subject, html, from }: EmailRequest = await req.json();
    
    if (!to || !subject || !html) {
      throw new Error("Missing required parameters: to, subject, or html");
    }

    console.log(`Sending email to ${to} with subject: ${subject}`);
    
    const { data, error } = await resend.emails.send({
      from: from || "AI Assistant <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log("Email sent successfully, response:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", data }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
