
// Updating the send-email function to use direct fetch instead of resend library
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
      return new Response(
        JSON.stringify({ success: false, error: "Resend API key not configured", details: "Check function logs" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log("Initializing email sending with API key");
    
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
    
    // Send the email using Resend API directly with fetch
    const fromAddress = from || "Welcome.Chat <admin@welcome.chat>";
    console.log(`Attempting to send email to ${toArray.join(', ')} from ${fromAddress} with subject "${subject}"`);
    
    try {
      // For testing/debugging - log the HTML content
      console.log("Email HTML content:", html.substring(0, 200) + "...");
      
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromAddress,
          to: toArray,
          subject: subject,
          html: html
        })
      });
      
      // Log response status for debugging
      console.log("Resend API response status:", resendResponse.status);
      
      const responseData = await resendResponse.json();
      console.log("Resend API response data:", responseData);
      
      if (!resendResponse.ok) {
        console.error("Error from Resend API:", responseData);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: responseData.message || "Failed to send email", 
            details: JSON.stringify(responseData) 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Email sent successfully:", responseData);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: responseData
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
