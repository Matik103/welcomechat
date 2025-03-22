
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Use the API key from environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate that we have the API key before proceeding
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set or empty");
      throw new Error("Email service configuration is missing (RESEND_API_KEY)");
    }

    // Parse the request body
    const { to, subject, html, from = "Welcome.Chat <admin@welcome.chat>" } = await req.json();
    
    // Validate required parameters
    if (!to || !subject || !html) {
      throw new Error("Missing required parameters: to, subject, and html are required");
    }

    console.log("Sending email:", {
      to,
      subject,
      from,
      htmlLength: html?.length || 0,
    });

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email sending error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: error.stack || "No stack trace available"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
