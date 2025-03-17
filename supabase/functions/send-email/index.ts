
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
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
    
    // Validate Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Resend API key not configured");
    }
    
    console.log("Initializing Resend client with API key length:", resendApiKey.length);
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    let body: EmailRequest;
    try {
      body = await req.json();
      console.log("Request body parsed successfully:", { 
        to: body.to, 
        subject: body.subject,
        fromProvided: !!body.from,
        htmlLength: body.html?.length || 0
      });
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
    
    const { to, subject, html, from } = body;
    
    // Validate required parameters
    if (!to || !subject || !html) {
      const missingParams = [];
      if (!to) missingParams.push("to");
      if (!subject) missingParams.push("subject");
      if (!html) missingParams.push("html");
      
      console.error("Missing required parameters:", missingParams.join(", "));
      throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);
    }
    
    // Send the email
    const fromAddress = from || "Welcome.Chat <admin@welcome.chat>";
    console.log(`Attempting to send email to ${to} from ${fromAddress} with subject "${subject}"`);
    
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html
      });
      
      if (error) {
        console.error("Error from Resend API:", error);
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
    } catch (sendError) {
      console.error("Resend API error details:", sendError);
      throw new Error(`Resend API error: ${sendError.message || "Unknown error"}`);
    }
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    // Enhanced error details
    const errorDetails = {
      message: error.message || "Failed to send email",
      code: error.code,
      status: error.status,
      name: error.name,
      stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined
    };
    
    return new Response(
      JSON.stringify({ 
        error: errorDetails.message,
        details: errorDetails
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
