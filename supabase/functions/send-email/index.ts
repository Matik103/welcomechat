
/// <reference lib="deno.ns" />
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
  action?: string;
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
    
    // Parse request body
    let body: EmailRequest;
    try {
      body = await req.json();
      console.log("Request body received:", {
        to: Array.isArray(body.to) ? body.to : [body.to],
        subject: body.subject,
        from: body.from || "default",
        htmlLength: body.html?.length || 0,
        action: body.action
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

    // Special handling for getting logs (for debugging)
    if (body.action === "get-logs") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Logs endpoint not implemented yet" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get the Resend API key from environment variable
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Resend API Key check:", {
      present: !!resendApiKey,
      length: resendApiKey?.length || 0,
      startsWithRe: resendApiKey?.startsWith('re_') || false,
      firstFourChars: resendApiKey?.substring(0, 4) || 'none'
    });
    
    if (!resendApiKey) {
      console.error("ERROR: Missing RESEND_API_KEY environment variable");
      throw new Error("Email service not configured: Missing API key");
    }

    if (!resendApiKey.startsWith('re_')) {
      console.error("ERROR: Invalid RESEND_API_KEY format");
      throw new Error("Email service not configured: Invalid API key format");
    }
    
    // Create Resend instance
    const resend = new Resend(resendApiKey);
    
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
    
    // Additional validation for 'to' email addresses
    const toArray = Array.isArray(to) ? to : [to];
    if (toArray.length === 0) {
      console.error("Empty recipient array");
      return new Response(
        JSON.stringify({ success: false, error: "No recipients specified" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Validate email format for each recipient
    for (const email of toArray) {
      if (typeof email !== 'string' || !email.includes('@')) {
        console.error("Invalid email format:", email);
        return new Response(
          JSON.stringify({ success: false, error: `Invalid email format: ${email}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // Send the email with a verified domain
    const fromAddress = from || "Welcome.Chat <admin@welcome.chat>";
    console.log(`Attempting to send email to ${toArray.join(', ')} from ${fromAddress} with subject "${subject}"`);
    
    try {
      // For testing/debugging - log the first part of the HTML content
      console.log("Email HTML content preview:", html.substring(0, 200) + "...");
      
      console.log("Calling Resend API directly...");
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: toArray,
          subject: subject,
          html: html,
          reply_to: "admin@welcome.chat"
        })
      });
      
      const result = await response.json();
      console.log("Raw Resend API response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: result
      });
      
      if (!response.ok) {
        console.error("Error from Resend API:", result);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: result.message || "Failed to send email", 
            details: result
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Email sent successfully:", result);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: result
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (sendError) {
      console.error("Resend API error details:", {
        error: sendError,
        message: sendError.message,
        name: sendError.name,
        stack: sendError.stack,
        stringified: JSON.stringify(sendError)
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: sendError.message || "Failed to send email",
          details: {
            message: sendError.message,
            name: sendError.name,
            stack: sendError.stack
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-email function:", {
      error,
      message: error.message,
      name: error.name,
      stack: error.stack,
      stringified: JSON.stringify(error)
    });
    
    // Enhanced error details
    const errorDetails = {
      message: error.message || "Failed to send email",
      code: error.code,
      status: error.status,
      name: error.name,
      stack: Deno.env.get("ENVIRONMENT") === "development" ? error.stack : undefined,
      stringified: typeof error === 'object' ? JSON.stringify(error) : error
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
