
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
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
    console.log("Test-env function started");
    
    // Get environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", {
      hasResendKey: !!resendApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      resendKeyLength: resendApiKey?.length || 0,
      resendKeyPrefix: resendApiKey?.substring(0, 3) || "none"
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        hasResendKey: !!resendApiKey,
        resendKeyValid: resendApiKey?.startsWith("re_") || false,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in test-env function:", err);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message || "Failed to check environment"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
