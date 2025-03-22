
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Check for Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const hasResendKey = !!resendApiKey;
    
    // Format information about the key for debugging
    let resendKeyFormat = "Not present";
    if (hasResendKey) {
      if (resendApiKey.startsWith("re_")) {
        resendKeyFormat = `Valid format (starts with re_), length: ${resendApiKey.length}`;
      } else {
        resendKeyFormat = `Invalid format (doesn't start with re_), length: ${resendApiKey.length}`;
      }
    }

    // Return environment information (without revealing actual secrets)
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        environment: Deno.env.get("ENVIRONMENT") || "development",
        hasResendKey,
        resendKeyFormat,
        serviceUrl: Deno.env.get("SUPABASE_URL") || "Not set",
        publicUrl: Deno.env.get("PUBLIC_SITE_URL") || "Not set"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error checking environment",
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
