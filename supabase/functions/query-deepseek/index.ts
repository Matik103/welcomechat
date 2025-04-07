
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
          status: 200, // Return 200 but with error info
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
      console.log(`Query length: ${body.query?.length || 0} characters`);
      console.log(`Model: ${body.model || 'deepseek-chat'}`);
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          answer: "I'm sorry, I couldn't process your request due to a technical issue. Please try again."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 for better UX but with error info
        }
      );
    }
    
    const { client_id, query, model = 'deepseek-chat' } = body;

    if (!client_id || !query) {
      const missingFields = [];
      if (!client_id) missingFields.push("client_id");
      if (!query) missingFields.push("query");
      
      console.error(`Missing required fields: ${missingFields.join(", ")}`);
      
      return new Response(
        JSON.stringify({
          error: `Missing required fields: ${missingFields.join(", ")}`,
          answer: "I'm sorry, I couldn't process your request due to missing information. Please try again."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 for better UX but with error info
        }
      );
    }

    console.log(`Processing query for client_id: ${client_id}`);
    console.log(`Query text: ${query}`);
    
    // Call DeepSeek API
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: "You are a helpful, friendly assistant that provides concise and accurate answers. If you don't know something, admit it rather than making up information."
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from DeepSeek API");
      }

      // Calculate processing time
      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      
      // Get the actual answer from the response
      const answer = data.choices[0].message.content;
      
      console.log("Answer generated successfully");
      console.log(`Processing time: ${processingTime}ms`);
      
      // Return the answer
      return new Response(
        JSON.stringify({
          answer: answer,
          processing_time_ms: processingTime
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
          answer: "I'm having trouble processing your request at the moment. Please try again later.",
          error: apiError instanceof Error ? apiError.message : "Unknown DeepSeek API error"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 but include error in payload
        }
      );
    }
  } catch (error) {
    console.error("Error in query-deepseek function:", error);
    return new Response(
      JSON.stringify({
        answer: "Sorry, I encountered an error processing your request. Please try again later.",
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 but include error in payload for better UX
      }
    );
  }
});
