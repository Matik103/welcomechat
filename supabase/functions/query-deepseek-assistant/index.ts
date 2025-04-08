
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { handleError, AppError, errorCodes } from "../_shared/middleware/errorHandler.ts";
import { corsHeaders } from "../_shared/middleware/cors.ts";
import { DEEPSEEK_API_KEY } from "../_shared/config.ts";

// Get environment variables for Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("🔍 Starting query-deepseek-assistant function");
    
    // Check for API key
    if (!DEEPSEEK_API_KEY) {
      console.error("⚠️ Missing DeepSeek API key");
      throw new AppError(
        500,
        "DeepSeek API key is not configured. Please add it in the Supabase dashboard under Settings > API.",
        errorCodes.UNAUTHORIZED,
        { missingKey: true }
      );
    }

    // Parse request body
    const { client_id, query } = await req.json();

    if (!client_id || !query) {
      console.error("❌ Missing required fields");
      throw new AppError(
        400,
        "Missing required fields: client_id and query are required",
        errorCodes.INVALID_INPUT
      );
    }

    console.log(`📝 Processing query for client_id: ${client_id}`);
    
    // Get the agent data including the system prompt for this client
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('agent_description, deepseek_assistant_id')
      .eq('client_id', client_id)
      .eq('interaction_type', 'config')
      .single();
      
    if (agentError) {
      console.error("❌ Error fetching agent data:", agentError);
      throw new AppError(
        500,
        `Error fetching agent data: ${agentError.message}`,
        errorCodes.DATABASE_ERROR
      );
    }
    
    if (!agentData) {
      console.error("❌ No agent data found for client:", client_id);
      throw new AppError(
        404,
        "No agent data found for this client",
        errorCodes.NOT_FOUND
      );
    }

    // Get the system instructions from agent description
    const systemInstruction = agentData.agent_description || "You are a helpful assistant.";
    console.log("💬 Using system instructions:", systemInstruction);

    // Make the direct API call to DeepSeek chat completions endpoint
    console.log("🚀 Sending request to DeepSeek API...");
    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!deepseekResponse.ok) {
      const errorBody = await deepseekResponse.text();
      console.error(`❌ DeepSeek API error (${deepseekResponse.status}):`, errorBody);
      throw new AppError(
        deepseekResponse.status,
        `DeepSeek API error: ${errorBody}`,
        errorCodes.OPENAI_ERROR
      );
    }
    
    const deepseekData = await deepseekResponse.json();
    console.log("✅ Received response from DeepSeek API");
    
    if (!deepseekData.choices || deepseekData.choices.length === 0) {
      console.error("❌ No choices in DeepSeek response:", deepseekData);
      throw new AppError(
        500,
        "Invalid response from DeepSeek API",
        errorCodes.OPENAI_ERROR
      );
    }
    
    // Extract the assistant's response
    const assistantResponse = deepseekData.choices[0].message.content;
    
    // Log the message exchange for debugging
    console.log(`📤 Query: ${query}`);
    console.log(`📥 Response: ${assistantResponse.substring(0, 100)}...`);
    
    // Return the response
    return new Response(
      JSON.stringify({
        answer: assistantResponse,
        messages: [
          { role: "user", content: query },
          { role: "assistant", content: assistantResponse }
        ]
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in query-deepseek-assistant function:", error);
    return handleError(error);
  }
});
