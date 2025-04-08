
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/middleware/cors.ts";
import { handleError, AppError, errorCodes } from "../_shared/middleware/errorHandler.ts";
import { DEEPSEEK_API_KEY } from "../_shared/config.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("🔍 Starting create-deepseek-assistant function");
    
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
    const { client_id, agent_name, agent_description, client_name } = await req.json();

    // Validate required fields
    if (!client_id || !agent_name) {
      console.error("❌ Missing required fields");
      throw new AppError(
        400,
        "Missing required fields: client_id and agent_name are required",
        errorCodes.INVALID_INPUT
      );
    }

    console.log(`🔧 Creating agent for client: ${client_id}`);
    
    // Create a system prompt if none is provided
    const systemPrompt = agent_description || `You are ${agent_name}, a helpful AI assistant${client_name ? ` for ${client_name}` : ''}. Answer questions clearly and concisely.`;
    
    console.log(`📝 Agent details: ${agent_name}`);
    console.log(`💬 Using system prompt: ${systemPrompt}`);

    // Generate a unique assistantId that will represent this agent
    const assistantId = crypto.randomUUID();
    
    // We're generating our own assistant ID since we're not using DeepSeek's assistants API
    console.log(`✅ Generated assistant ID: ${assistantId}`);

    return new Response(
      JSON.stringify({
        success: true,
        assistant_id: assistantId,
        message: "DeepSeek assistant created successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in create-deepseek-assistant function:", error);
    return handleError(error);
  }
});
