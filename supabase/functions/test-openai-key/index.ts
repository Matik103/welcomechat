
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Starting OpenAI API key test function");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Add diagnostic information
    const diagnostics = {
      function_version: "1.1",
      timestamp: new Date().toISOString(),
      openai_key_exists: !!OPENAI_API_KEY,
      openai_key_length: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
      request_headers: Object.fromEntries(req.headers),
    };
    
    console.log("Diagnostics:", JSON.stringify(diagnostics));
    
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured",
          diagnostics,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Test the OpenAI API key by making a simple request
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseData = await response.json();

      if (!response.ok) {
        console.error("OpenAI API error:", responseData);
        return new Response(
          JSON.stringify({
            error: responseData.error?.message || "OpenAI API request failed",
            status: response.status,
            raw_response: responseData,
            diagnostics,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 but with error info in body
          }
        );
      }

      // Return successful response
      return new Response(
        JSON.stringify({
          success: true,
          message: "OpenAI API key is valid",
          models_available: responseData.data ? responseData.data.length : 0,
          first_few_models: responseData.data ? responseData.data.slice(0, 5).map((model: any) => model.id) : [],
          diagnostics,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === "AbortError") {
        console.error("OpenAI API request timed out");
        return new Response(
          JSON.stringify({
            error: "OpenAI API request timed out after 10 seconds",
            diagnostics,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 408,
          }
        );
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in test-openai-key function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
        error_name: error instanceof Error ? error.name : "Unknown",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
