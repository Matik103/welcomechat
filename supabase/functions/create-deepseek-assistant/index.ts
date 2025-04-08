
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

    // Validate the API key format (simple check)
    if (!DEEPSEEK_API_KEY.startsWith('sk-')) {
      console.error("⚠️ Invalid DeepSeek API key format");
      throw new AppError(
        500,
        "The configured DeepSeek API key appears to be invalid. Please check your API key in the Supabase dashboard.",
        errorCodes.UNAUTHORIZED
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

    console.log(`🔧 Creating DeepSeek assistant for client: ${client_id}`);
    console.log(`📝 Assistant details: ${agent_name} - ${client_name || 'No client name provided'}`);

    // Create a system prompt if none is provided
    const systemPrompt = agent_description || `You are ${agent_name}, a helpful AI assistant${client_name ? ` for ${client_name}` : ''}. Answer questions clearly and concisely.`;
    
    console.log("💬 Using system prompt:", systemPrompt);

    // Create the assistant
    console.log("🔨 Creating assistant...");
    const createAssistantResponse = await fetch("https://api.deepseek.com/v1/assistants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        name: agent_name,
        instructions: systemPrompt,
        model: "deepseek-chat",
        tools: [],
        metadata: {
          client_id: client_id
        }
      })
    });

    if (!createAssistantResponse.ok) {
      const errorText = await createAssistantResponse.text();
      console.error("❌ Failed to create assistant:", errorText);
      
      let statusCode = createAssistantResponse.status;
      let errorMessage = `Failed to create DeepSeek assistant: ${errorText}`;
      
      // Special case for authentication errors
      if (statusCode === 401) {
        errorMessage = "Authentication failed. Please check your DeepSeek API key.";
      }
      
      throw new AppError(
        statusCode,
        errorMessage,
        errorCodes.OPENAI_ERROR
      );
    }

    const assistantData = await createAssistantResponse.json();
    console.log(`✅ Assistant created successfully with ID: ${assistantData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        assistant_id: assistantData.id,
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
