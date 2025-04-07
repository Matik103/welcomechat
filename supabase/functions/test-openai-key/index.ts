
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting OpenAI API key test function");
    
    if (!OPENAI_API_KEY) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Test the OpenAI API key by making a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", responseData);
      return new Response(
        JSON.stringify({
          error: responseData.error?.message || "OpenAI API request failed",
          status: response.status,
          raw_response: responseData,
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
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in test-openai-key function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
