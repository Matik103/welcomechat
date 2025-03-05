
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
    console.log("Send email function started");
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Resend API key not configured");
      throw new Error("Resend API key not configured");
    }
    
    const resend = new Resend(resendApiKey);
    
    const body: EmailRequest = await req.json();
    const { to, subject, html, from } = body;
    
    if (!to || !subject || !html) {
      console.error("Missing required parameters:", { to, subject, htmlProvided: !!html });
      throw new Error("Missing required parameters: to, subject, or html");
    }
    
    console.log(`Attempting to send email to: ${to}`);
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: from || "Welcome.Chat <admin@welcome.chat>",
      to: to,
      subject: subject,
      html: html
    });
    
    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }
    
    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: data
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: typeof error === 'object' ? JSON.stringify(error) : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
