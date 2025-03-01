
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Check for the Resend API key
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Email service not configured correctly. Missing API key." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let body;
    try {
      body = await req.json();
      console.log("Received email request:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      console.error("Missing required fields", { to, subject, hasHtml: !!html });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and html are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending email to ${to} with subject: ${subject}`);

    // Create a log entry before sending
    const { data: logEntry, error: logError } = await supabase
      .from("email_logs")
      .insert({
        email_to: to,
        subject: subject,
        status: "pending",
        metadata: { to, subject }
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating email log:", logError);
      // Continue despite logging error
    } else {
      console.log("Created email log entry:", logEntry.id);
    }

    // Send email using Resend
    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AI Assistant <admin@welcome.chat>",
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const resendData = await resendResponse.json();
      console.log("Resend API response:", JSON.stringify(resendData, null, 2));

      if (!resendResponse.ok) {
        throw new Error(`Resend API error: ${resendData.message || resendResponse.statusText}`);
      }

      // Update log entry on success
      if (logEntry) {
        await supabase
          .from("email_logs")
          .update({
            status: "sent",
            metadata: { ...logEntry.metadata, resend_id: resendData.id }
          })
          .eq("id", logEntry.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          id: resendData.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (sendError) {
      console.error("Error sending email via Resend:", sendError);
      
      // Update log entry on failure
      if (logEntry) {
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error: sendError.message,
            metadata: { ...logEntry.metadata, error: sendError.message }
          })
          .eq("id", logEntry.id);
      }
      
      throw sendError;
    }
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred while sending email",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
