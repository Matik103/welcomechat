
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the LlamaIndex API key from environment variable
    const llamaApiKey = Deno.env.get('LLAMA_CLOUD_API_KEY');
    
    // Get the OpenAI API key from environment variable
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!llamaApiKey) {
      return new Response(
        JSON.stringify({ error: "LLAMA_CLOUD_API_KEY not configured in Edge Function" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured in Edge Function" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    
    // Make the request to LlamaIndex API
    console.log("Calling LlamaIndex API for document parsing");
    const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llamaApiKey}`,
        'x-openai-api-key': openaiApiKey
      },
      body: JSON.stringify(requestData)
    });

    // Get the response as text first to properly debug
    const responseText = await response.text();
    console.log(`LlamaIndex API response status: ${response.status}`);
    
    // Try to parse the response as JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
      console.log("Successfully parsed LlamaIndex response as JSON");
    } catch (e) {
      console.error("Failed to parse LlamaIndex response as JSON:", e);
      console.log("Raw response:", responseText);
      
      return new Response(
        JSON.stringify({ error: "Invalid response from LlamaIndex API", raw: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the response
    return new Response(
      JSON.stringify(jsonResponse),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in LlamaIndex proxy:", error.message);
    
    return new Response(
      JSON.stringify({ error: `Error in LlamaIndex proxy: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
