
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface EmailRequest {
  to: string | string[];
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
    
    // Get the Resend API key from environment variable
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Email service not configured: Missing API key");
    }
    
    console.log("Initializing Resend client with API key");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    let body: EmailRequest;
    try {
      body = await req.json();
      console.log("Request body parsed successfully:", { 
        to: Array.isArray(body.to) ? body.to : [body.to], 
        subject: body.subject,
        fromProvided: !!body.from,
        htmlLength: body.html?.length || 0
      });
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body", details: e.message }), 
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
      return new Response(
        JSON.stringify({ success: false, error: `Missing required parameters: ${missingParams.join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Ensure to is always an array
    const toArray = Array.isArray(to) ? to : [to];
    
    // Send the email
    const fromAddress = from || "Welcome.Chat <admin@welcome.chat>";
    console.log(`Attempting to send email to ${toArray.join(', ')} from ${fromAddress} with subject "${subject}"`);
    
    try {
      // For testing/debugging - log the first part of the HTML content
      console.log("Email HTML content preview:", html.substring(0, 200) + "...");
      
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: toArray,
        subject: subject,
        html: html
      });
      
      if (error) {
        console.error("Error from Resend API:", error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: error.message || "Failed to send email", 
            details: JSON.stringify(error) 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: sendError.message || "Failed to send email",
          details: JSON.stringify(sendError)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
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
        success: false,
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
