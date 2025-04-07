import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get environment variables
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

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
    console.log("Starting query-deepseek function");
    const startTime = performance.now();
    
    // Check for API key
    if (!DEEPSEEK_API_KEY) {
      console.error("Missing DeepSeek API key");
      return new Response(
        JSON.stringify({
          error: "DeepSeek API key is not configured. Please contact your administrator.",
          answer: "I'm sorry, I can't process queries right now because the AI service is not properly configured."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
      console.log(`Request timestamp: ${body.timestamp || new Date().toISOString()}`);
      console.log(`Client ID: ${body.client_id}`);
      console.log(`Assistant ID: ${body.assistant_id}`);
      console.log(`Query length: ${body.query?.length || 0} characters`);
      console.log(`Model: ${body.model || 'deepseek-chat'}`);
      console.log(`Query text: ${body.query?.substring(0, 100)}${body.query?.length > 100 ? '...' : ''}`);
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          answer: "I'm sorry, I couldn't process your request because it was malformed."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate required fields
    if (!body.client_id || !body.query || !body.assistant_id) {
      console.error("Missing required fields:", {
        hasClientId: !!body.client_id,
        hasQuery: !!body.query,
        hasAssistantId: !!body.assistant_id
      });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          answer: "I'm sorry, I couldn't process your request because some required information was missing."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call DeepSeek API
    try {
      // Validate the API URL before making the request
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      console.log(`Calling DeepSeek API at: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for client ${body.client_id}. Assistant ID: ${body.assistant_id}`
            },
            {
              role: 'user',
              content: body.query
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.error(`DeepSeek API error status: ${response.status}`);
        const errorText = await response.text();
        console.error("DeepSeek API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Received response from DeepSeek API");
      
      if (!data.choices?.[0]?.message?.content) {
        console.error("Invalid response format from DeepSeek API:", data);
        throw new Error("Invalid response format from DeepSeek API");
      }

      const processingTimeMs = Math.round(performance.now() - startTime);
      const answer = data.choices[0].message.content;
      
      console.log("Answer generated successfully");
      console.log(`Processing time: ${processingTimeMs}ms`);
      console.log(`Answer length: ${answer.length} characters`);
      
      return new Response(
        JSON.stringify({
          answer,
          processing_time_ms: processingTimeMs
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (apiError) {
      console.error("DeepSeek API error:", apiError);
      return new Response(
        JSON.stringify({
          error: apiError instanceof Error ? apiError.message : "Unknown DeepSeek API error",
          answer: "I'm sorry, I encountered an error while processing your request. Please try again later."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error in query-deepseek function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        answer: "I'm sorry, I encountered an error while processing your request. Please try again later."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
